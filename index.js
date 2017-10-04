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

//Models
var Todo = require('./orm/todo');
var Tag = require('./orm/tag');

var todoResourceSchema = Joi.object({
    title: Joi.string(),
    completed: Joi.boolean(),
    order: Joi.number().integer(),
    url: Joi.string()
});

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
        if ("tag" in request.query) {
            Todo.find({"tags": request.query.tag}, function (err, todos) {
                if (err) {
                    reply({'error': "Nothing found"}).code(404);
                } else {
                    for (var t in todos) {
                        result.push(todos[t].toJson());
                    }
                    reply(result).code(200);
                }
            })
        } else {
            Todo.find(function (err, todos) {
                if (err) {
                    reply({"error": "Todo not found"}).code(404);
                } else {
                    for (var t in todos) {
                        result.push(todos[t].toJson());
                    }
                    reply(result).code(200);
                }
            });
        }
    },
    config: {
        tags: ['api'],
        description:
            'List all todos',
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Success',
                        schema:
                            Joi.array().items(
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
                reply({"error": "Todo id not found"}).code(404);
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
                    reply({"error": "Todo id not found"}).code(404);
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
        Todo.findByIdAndRemove(request.params.todo_id, function (err, todo) {
            if (err) {
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

//new functionality////////
//get all tags of a todo

server.route({
    method: 'GET',
    path: '/todos/{todo_id}/tags/',
    handler: function (request, reply) {

        Todo.findOne({_id: request.params.todo_id}, function (err, todo) {
            if (err) {
                reply({"error": "Todo id not found"}).code(404);
            } else {
                reply(todo.tags).code(200);
            }
        });
    },
    config: {
        tags: ['api'],
        description: 'Fetch a given todo and returns its tags',
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

//tag a todo
server.route({
    method: 'POST',
    path: '/todos/{todo_id}/tags/',
    handler: function (request, reply) {
        Todo.findById(request.params.todo_id, function (err, todo) {
            if (err) {
                reply({"error": "todo not found"}).code(404);
            } else {
                todo.tags.push(request.payload.id);
                todo.save(function (err, todo) {
                    if (err) {
                        reply({"error": "tag cound not be saved"}).code(500);
                    } else {
                        reply(todo).code(200);
                    }
                });

            }
        });
    },
    config: {
        tags: ['api'],
        description: 'Tags a todo',
        validate: {
            payload: {
                id: Joi.string().required()
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

//remove a tag from a todo
server.route({
    method: 'DELETE',
    path: '/todos/{todo_id}/tags/{tag_id}',
    handler: function (request, reply) {
        Todo.findById(request.params.todo_id, function (err, todo) {
            if (err) {
                reply({"error": "Todo not found"}).code(404);
            } else {
                todo.tags.splice(todo.tags.indexOf(request.params.tag_id), 1);
                todo.save(function (err, todo) {
                    if (err) {
                        reply({"error": "tag cound not be saved"}).code(500);
                    } else {
                        reply(todo).code(200);
                    }
                });
            }
        });
    },
    config: {
        tags: ['api'],
        description: 'Removes a tag from a todo',
        plugins: {
            'hapi-swagger': {
                responses: {
                    204: {description: 'Todo deleted'}
                }
            }
        }
    }
});

//tags////////
//list all
server.route({
    method: 'GET',
    path: '/tags/',
    handler: function (request, reply) {
        var result = [];
        Tag.find(function (err, todos) {
            if (todos.length === 0) {
                reply({"status": "There are no tags"}).code(200);
            } else {
                for (var t in todos) {
                    result.push(todos[t].toJson());
                }
                reply(result).code(200);
            }
        });
    },
    config: {
        tags: ['api'],
        description: 'List all tags',
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

//create tag
server.route({
    method: 'POST',
    path: '/tags/',
    handler: function (request, reply) {
        new Tag(request.payload).save(function (err, newTag) {
            if (err) {
                reply(err).code(500);
            } else {
                reply(newTag.toJson()).code(200);
            }
        });
    },
    config: {
        tags: ['api'],
        description: 'Create a todo',
        validate: {
            payload: {
                name: Joi.string().required()
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

//get one tag
server.route({
    method: 'GET',
    path: '/tags/{tag_id}',
    handler: function (request, reply) {
        Tag.findOne({_id: request.params.tag_id}, function (err, tag) {
            if (err) {
                reply({"error": "Tag id not found"}).code(404);
            } else {
                reply(tag.toJson()).code(200);
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

//update one tag
server.route({
    method: 'PATCH',
    path: '/tags/{tag_id}',
    handler: function (request, reply) {
        Tag.update({_id: request.params.tag_id}, {
                $set: {
                    name: request.payload.name || tag.name
                }
            },
            function (err, tag) {
                if (err) {
                    reply({"error": "Tag id not found"}).code(404);
                } else {
                    reply(tag).code(200);
                }
            })
    },
    config: {
        tags: ['api'],
        description: 'Update a given Tag',
        validate: {
            payload: {
                name: Joi.string()
            }
        },
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Success',
                        schema: todoResourceSchema.label('Result')
                    },
                    404: {description: 'Tag not found'}
                }
            }
        }
    }
});

//delete one tag

server.start(function (err) {
    console.log('Server running at:', server.info.uri);
});
