import { ApolloServer } from '@apollo/server';
import { conectarDB } from './config/db.js';
import { mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge';
import { ClienteResolvers } from './schema/Resolvers/Cliente.js';
import { ClienteTypeDefs } from './schema/TypeDefs/Cliente.js';
import { AdminResolvers } from './schema/Resolvers/Admin.js';
import { AdminTypeDefs } from './schema/TypeDefs/Admin.js';
import { ImperiotResolvers } from './schema/Resolvers/Imperiot.js';
import { ImperiotTypeDefs } from './schema/TypeDefs/Imperiot.js';
import jwt from 'jsonwebtoken';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import { makeExecutableSchema } from '@graphql-tools/schema';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import bodyParser from 'body-parser';
import { UsuarioResolvers } from './schema/Resolvers/Usuario.js';
import { UsuarioTypeDefs } from './schema/TypeDefs/Usuario.js';
const resolvers = mergeResolvers([ClienteResolvers, AdminResolvers, ImperiotResolvers, UsuarioResolvers]);
const typeDefs = mergeTypeDefs([ClienteTypeDefs, AdminTypeDefs, ImperiotTypeDefs, UsuarioTypeDefs]);
conectarDB();
// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
// });
const port = 4000;
// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const schema = makeExecutableSchema({ typeDefs, resolvers });
const app = express();
const httpServer = createServer(app);
const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
});
const serverCleanup = useServer({ schema }, wsServer);
const apolloServer = new ApolloServer({
    schema,
    plugins: [
        // Proper shutdown for the HTTP server.
        ApolloServerPluginDrainHttpServer({ httpServer }),
        // Proper shutdown for the WebSocket server.
        {
            async serverWillStart() {
                return {
                    async drainServer() {
                        await serverCleanup.dispose();
                    },
                };
            },
        },
    ],
});
await apolloServer.start();
// app.use('/graphql', cors<cors.CorsRequest>(), json(), expressMiddleware(server));
app.use('/graphql', cors(), bodyParser.json(), expressMiddleware(apolloServer, {
    context: async ({ res, req }) => {
        const token = req.headers['authorization'] || '';
        if (token) {
            try {
                const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.PALABRATOKEN);
                return {
                    usuario
                };
            }
            catch (error) {
                // console.log('esete es',error)
                return '';
            }
        }
    },
}));
httpServer.listen(port, () => {
    console.log(`🚀  Server ready at: http://localhost:${port}/graphql`);
});
// const { url } = await startStandaloneServer(server, {
//   listen: { port: 5000 },
//   context:async ({ res,req}) => {
//       const token =  req.headers['authorization'] || ''
//       if(token) {
//           try {
//               const usuario =  jwt.verify(token.replace('Bearer ', ''), process.env.PALABRATOKEN);
//               return {
//                   usuario
//               }
//           } catch (error) {
//               console.log('esete es',error)
//               return ''
//            }
//       } 
//   },
// });
// console.log(`🚀  Server ready at: ${url}`);
