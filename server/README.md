# Pokédex Trainer Server

GraphQL server for the Pokédex Trainer application.

## Features

- **Mock Database** (db.js) with:
  - Trainer profiles and statistics
  - Team management data
  - Battle history and logs

- **GraphQL Queries**:
  - Fetch trainer profiles and stats
  - List teams by trainer
  - Get battle history and detailed logs
  - Paginated Pokémon list from PokeAPI
  - Single Pokémon details (stats, abilities, moves, evolution chain)
  - Type matchups (damage relations)

- **GraphQL Mutations**:
  - Create, update, delete trainer teams
  - Log new battle results
  - Add detailed battle logs
  - Update trainer profile information

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The GraphQL server will run at `http://localhost:4000/graphql`

## API Endpoints

- `POST /graphql` - GraphQL queries and mutations
- `GET /health` - Health check endpoint

## Example Queries

### Get Trainer Profile
```graphql
query {
  getTrainerProfile(id: "1") {
    id
    name
    title
    bio
    stats {
      totalBattles
      wins
      winRate
    }
    teams {
      id
      name
      pokemon
    }
  }
}
```

### Get Paginated Pokemon List
```graphql
query {
  getPokemonList(limit: 20, offset: 0) {
    pokemon {
      id
      name
      types {
        name
      }
      stats {
        name
        baseStat
      }
      sprites {
        frontDefault
      }
    }
    total
    page
    hasMore
  }
}
```

### Get Single Pokemon Details
```graphql
query {
  getPokemonById(id: 25) {
    id
    name
    stats {
      name
      baseStat
    }
    abilities {
      name
    }
    moves {
      name
      level
    }
    evolutions {
      name
      evolvesTo {
        name
      }
    }
  }
}
```

### Get Type Matchups
```graphql
query {
  getTypeMatchup(type: "fire") {
    type
    doubleDamageTo
    halfDamageTo
    doubleDamageFrom
  }
}
```

### Create Team
```graphql
mutation {
  createTeam(
    trainerId: "1"
    name: "New Team"
    description: "My competitive team"
    pokemon: [6, 25, 39, 58, 77, 90]
  ) {
    id
    name
    pokemon
    createdAt
  }
}
```

### Log Battle
```graphql
mutation {
  logBattle(
    trainerId: "1"
    opponentId: "2"
    opponentName: "Misty"
    teamId: "1"
    result: WIN
  ) {
    id
    result
    date
  }
}
```

## Database Structure

### Trainers
- id, name, title, bio, email, avatar
- stats (totalBattles, wins, losses, winRate, currentStreak)

### Teams
- id, trainerId, name, description
- pokemon (array of Pokemon IDs)

### Battles
- id, trainerId, opponentId, opponentName, teamId, result, date

### Battle Logs
- id, battleId, trainerId, opponentId
- moves (array of move details per turn)
- duration, result

## PokeAPI Integration

All Pokemon data is fetched from [PokeAPI](https://pokeapi.co/api/v2/):
- Complete Pokemon stats, abilities, and moves
- Type matchups and damage relations
- Evolution chains
- Multiple sprite options
