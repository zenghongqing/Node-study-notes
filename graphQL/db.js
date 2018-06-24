import mongoose from 'mongoose'

mongoose.Promise = global.Promise;

mongoose.connection.on('open', function () {
    console.log('Connected to mongo server.');
});

mongoose.connection.on('error', function () {
    console.log('Could not connect to mongo server!');
    console.log(err);
});

mongoose.connect('mongodb://localhost:27017/graphqlTest')