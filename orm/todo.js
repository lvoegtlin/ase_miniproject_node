const Mongoose = require('mongoose');
var Tag = require('./tag');

var todoSchema = Mongoose.Schema({
    title: String,
    order: Number,
    completed: Boolean,
    tags: [{
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'Tag'

    }]
});

todoSchema.methods.toJson = function () {
    return {title: this.title, order: this.order, completed: this.completed};
};

module.exports = Mongoose.model("Todo", todoSchema);