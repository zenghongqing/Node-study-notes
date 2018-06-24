import {
    GraphQLObjectType,
    GraphQLSchema
} from 'graphql'

import UserQueries from './user/queries'
import UserMutations from './user/mutations'
// 导出GraphQLSchema模块
export default new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',
        fields: UserQueries
    }),
    mutation: new GraphQLObjectType({
        name: 'Mutations',
        fields: UserMutations
    })
})