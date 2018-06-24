const request = require('superagent');

request.get('http://localhost:3000/graphql').query({
    query: `{
        id,
        
    }`
}).end((err, res) => {
    console.log(!err && console.log(res.body.data))
})