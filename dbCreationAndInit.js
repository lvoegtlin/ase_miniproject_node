const Mongoose = require('mongoose');

var Todo = require('./orm/todo');

function dbCreationAndInit() {
    Mongoose.connect('mongodb://localhost/todos', {useMongoClient: true});
    var db = Mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {

        Todo.remove({}, function (err) {
            console.log("db deleted");
        });

        new Todo({title: 'build an API', order: 1, completed: false}).save();
        new Todo({title: '?????', order: 2, completed: false}).save();
        new Todo({title: 'profit!', order: 3, completed: false}).save();
    });
}

module.exports = {
    create: dbCreationAndInit()
};

