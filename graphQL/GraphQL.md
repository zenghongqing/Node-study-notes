### GraphQL与Koa2的结合使用

GraphQL是Facebook开发的一个应用层的查询语言，通过GraphQL，客户端可以从服务端的数据集中轻松获得一个自定义结构的数据。相较于RESTful API主要有以下特点:
(1) 根据需要返回数据
(2) 一个请求获取多个资源
(3) 提供內省系统
使得客户端尤其在查询数据方面得到了加强。

#### 相关的概念
* Operations
GraphQL提供的操作包括: query, mutation。其中query可以理解成RESTful API中的get请求，而mutation可以理解成POST，PUT之类的请求。

* Types
定义了GraphQL服务支持的类型，如：
```
    type User {
        id: ID,
        name: String
    }
    type Query {
        user: User
    }
```
定义了User类型和包含的字段以及字段的类型；定义Query返回一个User类型的user，Query也是一种类型。

* Scalar types
标量类型。GraphQL 默认提供的标量类型有：Int、Float、String、Boolean、ID，也可以实现自定义的标量类型，如：Date。注意：返回数据的类型必须是标量类型，
```
    query {
        user // 报错
    }
    // 正确写法
    query {
        user {
            id
            name
        }
    }
```
* Field
Field是我们想从服务器获取的对象的基本组成部分。
* Argument
和普通的函数一样，query可以拥有参数，参数是可选的或需求的。参数使用方法：
```
    {
      author(id: 5) {
        name
      }
    }
```
* Variables 
除了参数，query还允许你使用变量让参数可动态变化，变化以$开头书写，使用方式如下：
```
    query GetAuthor($authorID: Int!) {
          author(id: $authorID) {
            name
          }
        }
```
参数可以拥有默认值
```
    query GetAuthor($authorID: Int! = 5) {
          author(id: $authorID) {
            name
          }
        }
```
参数也可以是可选的或者必须的，比如上述的$authorID变量是必须的，它的定义中包含了!。
* Directives
传递变量给参数解决了一大堆这样的问题，但是我们可能也需要一个方式使用变量动态地改变我们查询的结构。
```
    query Hero($episode: Episode, $withFriends: Boolean!) {
      hero(episode: $episode) {
        name
        friends @include(if: $withFriends) {
          name
        }
      }
    }
```
@include(if: Boolean) 仅在参数为 true 时，包含此字段。
@skip(if: Boolean) 如果参数为 true，跳过此字段。
* Fragments
Fragments片段使你能够组织一组字段，然后在需要它们的的地方引入。
```
    {
      leftComparison: hero(episode: EMPIRE) {
        ...comparisonFields
      }
      rightComparison: hero(episode: JEDI) {
        ...comparisonFields
      }
    }
    
    fragment comparisonFields on Character {
      name
      appearsIn
      friends {
        name
      }
    }
    // 对应的查询数据
    {
      "data": {
        "leftComparison": {
          "name": "Luke Skywalker",
          "appearsIn": [
            "NEWHOPE",
            "EMPIRE",
            "JEDI"
          ],
          "friends": [
            {
              "name": "Han Solo"
            },
            {
              "name": "Leia Organa"
            },
            {
              "name": "C-3PO"
            },
            {
              "name": "R2-D2"
            }
          ]
        },
        "rightComparison": {
          "name": "R2-D2",
          "appearsIn": [
            "NEWHOPE",
            "EMPIRE",
            "JEDI"
          ],
          "friends": [
            {
              "name": "Luke Skywalker"
            },
            {
              "name": "Han Solo"
            },
            {
              "name": "Leia Organa"
            }
          ]
        }
      }
    }
```
片段的概念经常用于将复杂的应用数据需求分割成小块，特别是你要将大量不同片段的 UI 组件组合成一个初始数据获取的时候。
#### 与koa2结合

1. 首先新建好目录，以及项目初始化，安装koa，koa-bodyparser，koa-router,graphql-server-koa, mongoose等模块。
创建koa2的服务端文件，代码如下：
```
    import koa from 'koa'
    import KoaRouter from 'koa-router'
    import bodyParser from 'koa-bodyparser'
    import schema from './data/schema'  // 引入schema
    import { graphqlKoa, graphiqlKoa } from 'graphql-server-koa'
    
    import './db'
    const app = new koa();
    const router = new KoaRouter();
    
    const port = 3000;
    
    app.use(bodyParser());
    
    // 连接schema
    router.post('/graphql', graphqlKoa({schema: schema}));
    router.get('/graphql', graphqlKoa({schema: schema}));
    
    // Tool for test your queries: localhost:3000/graphiql, 用于可视化操作
    router.get('/graphiql', graphiqlKoa({endpointURL: '/graphql'}));
    
    app.use(router.routes()).use(router.allowedMethods());
    
    app.listen(port, () => {
        console.log('Server is running on', 'localhost:' + port);
        console.log('GraphiQL dashboard', 'localhost:' + port + '/graphiql');
    });
```
index.js文件是使node.js支持es6语法, babel-register模块改写require命令，为它加上一个钩子。此后，每当使用require加载.js、.jsx、.es和.es6后缀名的文件，就会先用Babel进行转码。
```
    require('babel-core/register')({
        'presets': [
            'stage-3',
            ["latest-node", { "target": "current" }]
        ]
    });
    
    require('babel-polyfill');
```
#### 编写schema
接下来是添加 GraphQL Schema（Schema 是 GraphQL 请求的入口，用户的 GraphQL 请求会对应到具体的 Schema)。
```
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
```
为了更好地维护将query和mutation操作分离到data/user下的文件queries.js和mutations.js中。为了更好地操作，首先可以定义类型：
```
    import {
        GraphQLObjectType,
        GraphQLInputObjectType,
        GraphQLNonNull,
        GraphQLString,
        GraphQLID
    } from 'graphql'
    // type for queries
    export let UserType = new GraphQLObjectType({
        name: 'User',
        fields: {
            _id: {
                type: new GraphQLNonNull(GraphQLID)
            },
            firstName: {
                type: GraphQLString
            },
            lastName: {
                type: GraphQLString
            }
        }
    });
    
    // type for mutations
    export let UserInput = new GraphQLInputObjectType({
        name: 'UserInput',
        fields: {
            firstName: {
                type: GraphQLString
            },
            lastName: {
                type: GraphQLString
            }
        }
    });
```
query操作
```
    import {
        GraphQLID,
        GraphQLList,
        GraphQLNonNull
    } from 'graphql'
    
    import { UserModel, UserInput, UserType } from "./model";
    
    // create field for receiving single user
    // 根据id查询单条User
    const User = {
        type: UserType,
        // 传进来的参数
        args: {
            id: {
                name: 'id',
                type: new GraphQLNonNull(GraphQLID) // 参数不为空
            }
        },
        /**
          * @param {root} 上层的返回值，这在循环嵌套的情况下会经常使用
          * @param {params} 第二个参数便是查询属性
          * @param {options} 第三个是我们一开始说的贯穿整个请求的上下文
          *
        **/
        resolve (root, params, options) {
            return UserModel.findById(params.id).exec()
        }
    };
    //  批量查询
    const Users = {
        type: new GraphQLList(UserType),
        args: {},
        resolve (root, params, options) {
            return UserModel.find().exec()
        }
    };
    
    export default {
        User: User,
        Users: Users
    }
```
mutation操作
```
    import {
        GraphQLNonNull,
        GraphQLBoolean
    } from 'graphql'
    
    import { UserModel, UserType, UserInput } from './model';
    
    const UserCreate = {
        description: 'Create new user',
        type: GraphQLBoolean,
        args: {
            data: {
                name: 'data',
                type: new GraphQLNonNull(UserInput)
            }
        },
        async resolve(root, params, options) {
            const userModel = new UserModel(params.data);
            const newUser = await userModel.save();
            if (!newUser) {
                throw new Error('Error adding new user');
            }
            return true;
        }
    };
    
    export default {
        UserCreate: UserCreate
    }
```
注意: GraphQL中的字符串需要包装在双引号中。

添加用户信息
```
    mutation Mutation {
      UserCreate (
        data: {firstName: "123", lastName: "456"}
      )
    }
```
查询用户信息
```
    query Query {
      Users {
        firstName,
        lastName
      }
    }
```
可以根据下图右边的提示检查 GraphQL 的语法，发送 GraphQL 的请求。
<img src='https://misc.aotu.io/booxood/graphql-use/github-doc.png'>
