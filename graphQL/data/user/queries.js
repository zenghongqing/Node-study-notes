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
    args: {
        id: {
            name: 'id',
            type: new GraphQLNonNull(GraphQLID)
        }
    },
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