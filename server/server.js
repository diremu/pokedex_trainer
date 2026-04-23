const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const PORT = 4000;
const app = express();

app.use(cors());
app.use(express.json());

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    return error;
  }
});

async function startServer() {
  try {
    await server.start();

  app.use('/graphql', expressMiddleware(server));
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Pokédex Trainer Server is running' });
  });
  app.listen(PORT, () => {
    console.log(`GraphQL Server running at http://localhost:${PORT}/graphql`);
    console.log(`Pokédex Trainer API is ready!`);
  })
  } catch (err) {
    console.error(err.message)
  }
}

startServer();