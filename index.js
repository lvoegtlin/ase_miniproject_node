const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Joi = require('joi');
const Mongoose = require('mongoose');

///db
Mongoose.connect('mongodb://localhost/todos', {useMongoClient: true});
var db = Mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

//models

var todoSchema = Mongoose.Schema({
    title: String,
    order: Number,
    completed: Boolean
});

todoSchema.methods.toJson = function () {
    return {title: this.title, order: this.order, completed: this.completed};
};

var Todo = Mongoose.model("Todo", todoSchema);

////

var todos = {
    1: {title: 'build an API', order: 1, completed: false},
    2: {title: '?????', order: 2, completed: false},
    3: {title: 'profit!', order: 3, completed: false}
};

var todoResourceSchema = Joi.object({
    title: Joi.string(),
    completed: Joi.boolean(),
    order: Joi.number().integer(),
    url: Joi.string()
});

var getTodo = function (id) {
    if (!(id in todos)) {
        return false;
    }
    return {
        title: todos[id].title,
        completed: todos[id].completed,
        order: todos[id].order,
        url: server.info.uri + '/todos/' + id
    };
};

const server = new Hapi.Server();
server.connection({
    host: '127.0.0.1',
    port: 5000,
    routes: {cors: true}
});

const swaggerOptions = {
    info: {
        'title': 'Todo API',
        'version': '1.0',
        'description': 'A simple TODO API',
    },
    documentationPath: '/doc',
    tags: [
        {
            description: 'TODO operations',
            name: 'todos'
        }
    ]
};

server.register([
    Inert,
    Vision,
    {
        register: HapiSwagger,
        options: swaggerOptions
    }
]);

server.route({
    method: 'GET',
    path: '/todos/',
    handler: function (request, reply) {
        var result = [];
        Todo.find(function (err, todos) {
            for (var t in todos) {
                result.push(todos[t].toJson());
            }
            reply(result).code(200);
        });
    },
    config: {
        tags: ['api'],
        description: 'List all todos',
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Success',
                        schema: Joi.array().items(
                            todoResourceSchema.label('Result')
                        )
                    }
                }
            }
        }
    }
});

server.route({
    method: 'DELETE',
    path: '/todos/',
    handler: function (request, reply) {
        Todo.remove({}, function (err) {
            reply(err);
        });
        reply();
    },
    config: {
        tags: ['api'],
        description: 'Delete all todos',
        plugins: {
            'hapi-swagger': {
                responses: {
                    204: {description: 'Todos deleted'}
                }
            }
        }
    }
});

server.route({
    method: 'POST',
    path: '/todos/',
    handler: function (request, reply) {
        new Todo(request.payload).save(function (err, newTodo) {
            if (err) {
                reply(err).code(500);
            } else {
                reply(newTodo.toJson()).code(200);
            }
        });
    },
    config: {
        tags: ['api'],
        description: 'Create a todo',
        validate: {
            payload: {
                title: Joi.string().required(),
                order: Joi.number().integer(),
                completed: Joi.boolean()
            }
        },
        plugins: {
            'hapi-swagger': {
                responses: {
                    201: {
                        description: 'Created',
                        schema: todoResourceSchema.label('Result')
                    }
                }
            }
        }
    }
});

server.route({
    method: 'GET',
    path: '/todos/{todo_id}',
    handler: function (request, reply) {

        Todo.findOne({_id: request.params.todo_id}, function (err, todo) {
            if (err) {
                reply({"error": "Todo id not found"}).code(500);
            } else {
                reply(todo.toJson()).code(200);
            }
        });
    },
    config: {
        tags: ['api'],
        description: 'Fetch a given todo',
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Success',
                        schema: todoResourceSchema.label('Result')
                    },
                    404: {description: 'Todo not found'}
                }
            }
        }
    }
});

server.route({
    method: 'PATCH',
    path: '/todos/{todo_id}',
    handler: function (request, reply) {

        Todo.update({_id: request.params.todo_id}, {
                $set: {
                    title: request.payload.title || todo.title,
                    order: request.payload.order || todo.order,
                    completed: request.payload.completed || todo.completed
                }
            },
            function (err, todo) {
                if (err) {
                    reply({"error": "Todo id not found"}).code(500);
                } else {
                    reply(todo).code(200);
                }
            })
    },
    config: {
        tags: ['api'],
        description: 'Update a given todo',
        validate: {
            payload: {
                title: Joi.string(),
                completed: Joi.boolean(),
                order: Joi.number()
            }
        },
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Success',
                        schema: todoResourceSchema.label('Result')
                    },
                    404: {description: 'Todo not found'}
                }
            }
        }
    }
});

server.route({
    method: 'DELETE',
    path: '/todos/{todo_id}',
    handler: function (request, reply) {
        Todo.findByIdAndRemove(request.params.todo_id, function(err, todo){
            if(err){
                reply('Todo Not Found').code(404);
            } else {
                reply(todo).code(204)
            }
        });

    },
    config: {
        tags: ['api'],
        description: 'Delete a given todo',
        plugins: {
            'hapi-swagger': {
                responses: {
                    204: {description: 'Todo deleted'},
                    404: {description: 'Todo not found'}
                }
            }
        }
    }
});

server.start((err) => {
    console.log('Server running at:', server.info.uri);
})
;
