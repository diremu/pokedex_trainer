const axios = require('axios');
const db = require('./db');
const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const pokeAPIClient = axios.create({
  baseURL: POKEAPI_BASE,
  timeout: 10000
});
const pokemonCache = new Map();

const fetchPokemon = async (idOrName) => {
  try {
    const cacheKey = String(idOrName).toLowerCase();
    if (pokemonCache.has(cacheKey)) {
      return pokemonCache.get(cacheKey);
    }

    const response = await pokeAPIClient.get(`/pokemon/${idOrName}`);
    const pokemonData = response.data;

    const speciesResponse = await axios.get(pokemonData.species.url);
    const evolutionChainUrl = speciesResponse.data.evolution_chain.url;
    const evolutionResponse = await axios.get(evolutionChainUrl);

    const pokemonResult = {
      id: pokemonData.id,
      name: pokemonData.name,
      height: pokemonData.height,
      weight: pokemonData.weight,
      baseExperience: pokemonData.base_experience,
      types: pokemonData.types.map(t => ({
        name: t.type.name,
        slot: t.slot
      })),
      stats: pokemonData.stats.map(s => ({
        name: s.stat.name,
        baseStat: s.base_stat,
        effort: s.effort
      })),
      abilities: pokemonData.abilities.map(a => ({
        name: a.ability.name,
        slot: a.slot,
        isHidden: a.is_hidden
      })),
      moves: pokemonData.moves.slice(0, 10).map(m => ({
        name: m.move.name,
        level: m.version_group_details[0]?.level_learned_at || null
      })),
      sprites: {
        frontDefault: pokemonData.sprites.front_default,
        backDefault: pokemonData.sprites.back_default,
        frontShiny: pokemonData.sprites.front_shiny,
        backShiny: pokemonData.sprites.back_shiny
      },
      evolutions: parseEvolutionChain(evolutionResponse.data.chain)
    };

    pokemonCache.set(cacheKey, pokemonResult);
    return pokemonResult;
  } catch (error) {
    console.error(`Error fetching Pokemon ${idOrName} from PokeAPI v2:`, error.message);
    return null;
  }
};

const parseEvolutionChain = (chain) => {
  const evolution = {
    id: null,
    name: chain.species.name,
    evolvesTo: []
  };

  if (chain.evolves_to && chain.evolves_to.length > 0) {
    evolution.evolvesTo = chain.evolves_to.map(e => parseEvolutionChain(e));
  }

  return evolution;
};

const fetchTypeMatchup = async (type) => {
  try {
    const response = await pokeAPIClient.get(`/type/${type.toLowerCase()}`);
    const data = response.data.damage_relations;

    return {
      type: type,
      doubleDamageTo: data.double_damage_to.map(t => t.name),
      halfDamageTo: data.half_damage_to.map(t => t.name),
      noDamageTo: data.no_damage_to.map(t => t.name),
      doubleDamageFrom: data.double_damage_from.map(t => t.name),
      halfDamageFrom: data.half_damage_from.map(t => t.name),
      noDamageFrom: data.no_damage_from.map(t => t.name)
    };
  } catch (error) {
    console.error(`Error fetching type matchup from PokeAPI v2 for ${type}:`, error.message);
    return null;
  }
};

const resolvers = {
  Query: {
    getTrainerProfile: async (_, { id }) => {
      const trainer = db.getTrainerById(parseInt(id));
      if (!trainer) return null;
      
      return {
        id: String(trainer.id),
        name: trainer.name,
        title: trainer.rank,
        bio: '',
        email: '',
        avatar: trainer.avatar_url,
        createdAt: new Date().toISOString(),
        stats: {
          totalBattles: db.getBattlesByTrainer(trainer.id).length,
          wins: db.getBattlesByTrainer(trainer.id).filter(b => b.result === 'win').length,
          losses: db.getBattlesByTrainer(trainer.id).filter(b => b.result === 'loss').length,
          winRate: 0,
          currentStreak: 0
        },
        teams: db.getTeamsByTrainer(trainer.id).map(t => ({
          id: String(t.id),
          trainerId: String(t.trainer_id),
          name: t.name,
          description: '',
          pokemon: t.pokemon_ids,
          createdAt: t.created_at,
          updatedAt: t.created_at
        })),
        battles: db.getBattlesByTrainer(trainer.id).map(b => ({
          id: String(b.id),
          trainerId: String(b.trainer_id),
          opponentId: String(b.id),
          opponentName: b.opponent_name,
          teamId: String(b.team_id),
          result: b.result.toUpperCase(),
          date: b.date,
          battleLog: ''
        }))
      };
    },

    getAllTrainers: () => {
      return db.trainers.map(trainer => ({
        id: String(trainer.id),
        name: trainer.name,
        title: trainer.rank,
        bio: '',
        email: '',
        avatar: trainer.avatar_url,
        createdAt: new Date().toISOString(),
        stats: {
          totalBattles: db.getBattlesByTrainer(trainer.id).length,
          wins: db.getBattlesByTrainer(trainer.id).filter(b => b.result === 'win').length,
          losses: db.getBattlesByTrainer(trainer.id).filter(b => b.result === 'loss').length,
          winRate: 0,
          currentStreak: 0
        }
      }));
    },

    getTeamsByTrainer: (_, { trainerId }) => {
      return db.getTeamsByTrainer(parseInt(trainerId)).map(team => ({
        id: String(team.id),
        trainerId: String(team.trainer_id),
        name: team.name,
        description: '',
        pokemon: team.pokemon_ids,
        createdAt: team.created_at,
        updatedAt: team.created_at
      }));
    },

    getTeamById: async (_, { id }) => {
      const team = db.teams.find(t => t.id === parseInt(id));
      if (!team) return null;

      const pokemonDetails = await Promise.all(
        team.pokemon_ids.map(pokemonId => fetchPokemon(pokemonId))
      );

      return {
        id: String(team.id),
        trainerId: String(team.trainer_id),
        name: team.name,
        description: '',
        pokemon: team.pokemon_ids,
        pokemonDetails: pokemonDetails.filter(p => p !== null),
        createdAt: team.created_at,
        updatedAt: team.created_at
      };
    },

    getBattlesByTrainer: (_, { trainerId }) => {
      return db.getBattlesByTrainer(parseInt(trainerId)).map(battle => ({
        id: String(battle.id),
        trainerId: String(battle.trainer_id),
        opponentId: String(battle.id),
        opponentName: battle.opponent_name,
        teamId: String(battle.team_id),
        result: battle.result.toUpperCase(),
        date: battle.date
      }));
    },

    getBattleById: (_, { id }) => {
      const battle = db.battles.find(b => b.id === parseInt(id));
      if (!battle) return null;
      return {
        id: String(battle.id),
        trainerId: String(battle.trainer_id),
        opponentId: String(battle.id),
        opponentName: battle.opponent_name,
        teamId: String(battle.team_id),
        result: battle.result.toUpperCase(),
        date: battle.date
      };
    },

    getBattleLogs: (_, { trainerId }) => {
      return db.battleLogs.filter(log => log.battle_id && db.battles.find(b => b.id === log.battle_id && b.trainer_id === parseInt(trainerId)));
    },

    getPokemonList: async (_, { limit = 20, offset = 0 }) => {
      try {
        const response = await axios.get(`${POKEAPI_BASE}/pokemon?limit=${limit}&offset=${offset}`);
        const total = response.data.count;
        
        const pokemon = await Promise.all(
          response.data.results.map(p => fetchPokemon(p.name))
        );

        return {
          pokemon: pokemon.filter(p => p !== null),
          total,
          page: Math.floor(offset / limit) + 1,
          pageSize: limit,
          hasMore: offset + limit < total
        };
      } catch (error) {
        console.error('Error fetching Pokemon list:', error.message);
        return {
          pokemon: [],
          total: 0,
          page: 1,
          pageSize: limit,
          hasMore: false
        };
      }
    },

    getPokemonById: async (_, { id }) => {
      return await fetchPokemon(id);
    },

    getPokemonByName: async (_, { name }) => {
      return await fetchPokemon(name.toLowerCase());
    },

    getPokemonsByType: async (_, { type }) => {
      try {
        const response = await axios.get(`${POKEAPI_BASE}/type/${type.toLowerCase()}`);
        const pokemon = await Promise.all(
          response.data.pokemon.slice(0, 20).map(p => fetchPokemon(p.pokemon.name))
        );
        return pokemon.filter(p => p !== null);
      } catch (error) {
        console.error('Error fetching Pokemon by type:', error.message);
        return [];
      }
    },

    getTypeMatchup: async (_, { type }) => {
      return await fetchTypeMatchup(type);
    }
  },

  Mutation: {
    createTeam: (_, { trainerId, name, description, pokemon }) => {
      const team = db.addTeam({
        trainer_id: parseInt(trainerId),
        name,
        pokemon_ids: pokemon
      });
      return {
        id: String(team.id),
        trainerId: String(team.trainer_id),
        name: team.name,
        description: '',
        pokemon: team.pokemon_ids,
        createdAt: team.created_at,
        updatedAt: team.created_at
      };
    },

    updateTeam: async (_, { id, name, description, pokemon }) => {
      const team = db.updateTeam(parseInt(id), { 
        name, 
        pokemon_ids: pokemon 
      });
      if (!team) return null;

      return {
        id: String(team.id),
        trainerId: String(team.trainer_id),
        name: team.name,
        description: '',
        pokemon: team.pokemon_ids,
        createdAt: team.created_at,
        updatedAt: team.created_at
      };
    },

    deleteTeam: (_, { id }) => {
      return db.deleteTeam(parseInt(id));
    },

    logBattle: (_, { trainerId, opponentId, opponentName, teamId, result }) => {
      const battle = db.addBattle({
        trainer_id: parseInt(trainerId),
        opponent_name: opponentName,
        team_id: parseInt(teamId),
        result: result.toLowerCase(),
        score_trainer: 0,
        score_opponent: 0
      });
      return {
        id: String(battle.id),
        trainerId: String(battle.trainer_id),
        opponentId: String(battle.id),
        opponentName: battle.opponent_name,
        teamId: String(battle.team_id),
        result: battle.result.toUpperCase(),
        date: battle.date
      };
    },

    addBattleLog: (_, { battleId, trainerId, opponentId, moves, duration, result }) => {
      const log = db.addBattleLog({
        battle_id: parseInt(battleId),
        trainer_id: parseInt(trainerId),
        message: `Battle logged: ${moves.length} moves recorded`,
        severity: result === 'WIN' ? 'success' : 'danger'
      });
      return log;
    },

    updateTrainerProfile: (_, { id, name, bio, title }) => {
      const trainer = db.updateTrainerProfile(parseInt(id), { 
        name,
        rank: title
      });
      if (!trainer) return null;
      return {
        id: String(trainer.id),
        name: trainer.name,
        title: trainer.rank,
        bio: '',
        email: '',
        avatar: trainer.avatar_url,
        createdAt: new Date().toISOString(),
        stats: {
          totalBattles: db.getBattlesByTrainer(trainer.id).length,
          wins: db.getBattlesByTrainer(trainer.id).filter(b => b.result === 'win').length,
          losses: db.getBattlesByTrainer(trainer.id).filter(b => b.result === 'loss').length,
          winRate: 0,
          currentStreak: 0
        }
      };
    }
  }
};

module.exports = resolvers;
