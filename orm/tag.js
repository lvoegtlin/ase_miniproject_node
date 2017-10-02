const Mongoose = require('mongoose');
var Todo = require('./todo');

var tagSchema = Mongoose.Schema({
    name: String,
    todos: [{
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'Todo'

    }]
});

tagSchema.methods.toJson = function () {
    return { name: this.name, todos: this.todos };
};

module.exports = Mongoose.model("Tag", tagSchema);