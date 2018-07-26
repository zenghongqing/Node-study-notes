require('./connect')
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var personSchema = Schema({
    _id: Schema.Types.ObjectId,
    name: String,
    age: Number,
    stories: [{ type: Schema.Types.ObjectId, ref: 'Story' }]
});

var storySchema = Schema({
    author: { type: Schema.Types.ObjectId, ref: 'Person' },
    title: String,
    fans: [{ type: Schema.Types.ObjectId, ref: 'Person' }]
});
var Person = mongoose.model('Person', personSchema);

var author = new Person({
    _id: new mongoose.Types.ObjectId(),
    name: 'Ian Fleming',
    age: 50
});

author.save(function (err) {
    if (err) return console.log(err);
    console.log('author saved');
    var story1 = new Story({
        title: 'Casino Royale',
        author: author._id    // assign the _id from the person
    });

    story1.save(function (err) {
        if (err) return console.log(err);
        console.log('story saved')
        // thats it!
    });
});
storySchema.statics = {
    getStoryOfAuthor: function (titleName, callback) {
        this.findOne({title: titleName}).populate('author').exec(callback)
    }
};
var Story = mongoose.model('Story', storySchema);

Story.getStoryOfAuthor('Casino Royale', function (err, doc) {
    console.log(doc, '111')
})