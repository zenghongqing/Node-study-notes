import koa from 'koa'
import KoaRouter from 'koa-router'
import bodyParser from 'koa-bodyparser'
import schema from './data/schema'
import { graphqlKoa, graphiqlKoa } from 'graphql-server-koa'

import './db'
const app = new koa();
const router = new KoaRouter();

const port = 3000;

app.use(bodyParser());

router.post('/graphql', graphqlKoa({schema: schema}));
router.get('/graphql', graphqlKoa({schema: schema}));

// Tool for test your queries: localhost:3000/graphiql
router.get('/graphiql', graphiqlKoa({endpointURL: '/graphql'}));

app.use(router.routes()).use(router.allowedMethods());

app.listen(port, () => {
    console.log('Server is running on', 'localhost:' + port);
    console.log('GraphiQL dashboard', 'localhost:' + port + '/graphiql');
});