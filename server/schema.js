
const typeDefs = `
  type TrainerProfile {
    id: ID!
    name: String!
    title: String!
    email: String!
    avatar_url: String
    region: String
    rank: String
    createdAt: String!
    stats: TrainerStats!
    teams: [Team!]!
    battles: [Battle!]!
  }

  type TrainerStats {
    totalBattles: Int!
    wins: Int!
    losses: Int!
    winRate: Float!
    currentStreak: Int!
  }

  # Team Type
  type Team {
    id: ID!
    trainerId: ID!
    name: String!
    description: String
    pokemon: [Int!]!
    pokemonDetails: [Pokemon!]!
    createdAt: String!
    updatedAt: String!
  }

  # Battle Type
  type Battle {
    id: ID!
    trainerId: ID!
    opponentId: ID!
    opponentName: String!
    teamId: ID!
    result: BattleResult!
    date: String!
    battleLog: String
    details: BattleLog
  }

  enum BattleResult {
    WIN
    LOSS
    DRAW
  }

  # Battle Log Type
  type BattleLog {
    id: ID!
    battleId: ID!
    trainerId: ID!
    opponentId: ID!
    moves: [Move!]!
    duration: Int!
    result: BattleResult!
  }

  type Move {
    turn: Int!
    player: String!
    pokemonId: Int!
    moveName: String!
    damage: Int!
  }

  # Pokemon Types from PokeAPI
  type Pokemon {
    id: Int!
    name: String!
    height: Int
    weight: Int
    baseExperience: Int
    types: [PokemonType!]!
    stats: [Stat!]!
    abilities: [Ability!]!
    moves: [MoveInfo!]!
    sprites: PokemonSprites!
    evolutions: [PokemonEvolution!]
  }

  type PokemonType {
    name: String!
    slot: Int!
  }

  type Stat {
    name: String!
    baseStat: Int!
    effort: Int!
  }

  type Ability {
    name: String!
    slot: Int!
    isHidden: Boolean!
  }

  type MoveInfo {
    name: String!
    level: Int
  }

  type PokemonSprites {
    frontDefault: String
    backDefault: String
    frontShiny: String
    backShiny: String
  }

  type PokemonEvolution {
    id: Int!
    name: String!
    evolvesTo: [PokemonEvolution!]
  }

  # Type Matchup Type
  type TypeMatchup {
    type: String!
    doubleDamageTo: [String!]!
    halfDamageTo: [String!]!
    noDamageTo: [String!]!
    doubleDamageFrom: [String!]!
    halfDamageFrom: [String!]!
    noDamageFrom: [String!]!
  }

  # Paginated Pokemon List Response
  type PokemonListResponse {
    pokemon: [Pokemon!]!
    total: Int!
    page: Int!
    pageSize: Int!
    hasMore: Boolean!
  }

  # Queries
  type Query {
    # Trainer Queries
    getTrainerProfile(id: ID!): TrainerProfile
    getAllTrainers: [TrainerProfile!]!

    # Team Queries
    getTeamsByTrainer(trainerId: ID!): [Team!]!
    getTeamById(id: ID!): Team

    # Battle Queries
    getBattlesByTrainer(trainerId: ID!): [Battle!]!
    getBattleById(id: ID!): Battle
    getBattleLogs(trainerId: ID!): [BattleLog!]!

    # Pokemon Queries
    getPokemonList(limit: Int, offset: Int): PokemonListResponse!
    getPokemonById(id: Int!): Pokemon
    getPokemonByName(name: String!): Pokemon
    getPokemonsByType(type: String!): [Pokemon!]!
    
    # Type Matchup Query
    getTypeMatchup(type: String!): TypeMatchup
  }

  # Mutations
  type Mutation {
    # Team Mutations
    createTeam(trainerId: ID!, name: String!, description: String, pokemon: [Int!]!): Team!
    updateTeam(id: ID!, name: String, description: String, pokemon: [Int!]): Team!
    deleteTeam(id: ID!): Boolean!

    # Battle Mutations
    logBattle(trainerId: ID!, opponentId: ID!, opponentName: String!, teamId: ID!, result: BattleResult!): Battle!
    addBattleLog(battleId: ID!, trainerId: ID!, opponentId: ID!, moves: [MoveInput!]!, duration: Int!, result: BattleResult!): BattleLog!

    # Trainer Profile Mutations
    updateTrainerProfile(id: ID!, name: String, bio: String, title: String): TrainerProfile!
  }

  input MoveInput {
    turn: Int!
    player: String!
    pokemonId: Int!
    moveName: String!
    damage: Int!
  }
`;

module.exports = typeDefs;
