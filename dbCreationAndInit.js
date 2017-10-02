var mongoose = require('mongoose');

var todoSchema = mongoose.Schema({
    title: String,
    order: Number,
    completed: Boolean
});

var conn;

var Todo = mongoose.model("Todo", todoSchema);

function dbCreationAndInit() {
    var db = getDbConnection();

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

function getDbConnection() {
    if (!conn) {
        mongoose.connect('mongodb://localhost/todos', {useMongoClient: true});
        conn = mongoose.connection;
    }

    return conn;
}

module.exports = {
    Todo: Todo,
    create: dbCreationAndInit(),
    dbCon: getDbConnection()
};

