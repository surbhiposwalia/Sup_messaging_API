var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var app = express();
var User = require('./models/user');
var Message = require('./models/message')
var jsonParser = bodyParser.json();
// Add your API endpoints here
mongoose.Promise = global.Promise


var runServer = function(callback) {
    var databaseUri = process.env.DATABASE_URI || global.databaseUri || 'mongodb://localhost/sup';
    mongoose.connect(databaseUri).then(function() {
        var port = process.env.PORT || 8080;
        var server = app.listen(port, function() {
            console.log('Listening on localhost:' + port);
            if (callback) {
                callback(server);
            }
        });
    });
};

if (require.main === module) {
    runServer();
};



app.get('/users', function(req, res) {
    User.find({}, function(err, users) {
        if (err) {
            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }
        return res.json(users);
    });
});

app.post('/users', jsonParser, function(req, res) {
    var inputUsername = req.body.username
    User.create({
        username: inputUsername
    }, function(err, user) {
        if (!inputUsername) {
            return res.status(422).json({
                message: 'Missing field: username'
            });

        }
        else if (typeof inputUsername !== 'string') {
            return res.status(422).json({
                message: 'Incorrect field type: username'
            });
        }
        return res.status(201).location('/users/' + user._id).json({});
    });
});

app.get("/users/:userId", jsonParser, function(req, res) {
    var inputID = req.params.userId

    User.findOne({
        _id: inputID
    }, function(err, user) {
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        return res.status(200).json(user);
    });
});

app.put("/users/:userId", jsonParser, function(req, res) {
    var inputID = req.params.userId;
    var inputUsername = req.body.username;

    User.findByIdAndUpdate(inputID, {
        username: inputUsername
    }, {
        upsert: true
    }, function(err, user) {

        if (!inputUsername) {
            return res.status(422).json({
                message: 'Missing field: username'
            });
        }
        else if (typeof inputUsername !== 'string') {
            return res.status(422).json({
                message: 'Incorrect field type: username'
            });
        }
        return res.status(200).json({});
    });
});

app.delete("/users/:userId", jsonParser, function(req, res) {
    var inputID = req.params.userId;
    User.findByIdAndRemove(inputID, function(err, user) {
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        return res.status(200).json({});
    })
});

app.get("/messages", function(req, res) {
    var fromQuery = req.query.from,
        toQuery = req.query.to,
        finalQuery;

    if (fromQuery && toQuery) {
        finalQuery = {
            from: fromQuery,
            to: toQuery
        };
    }
    else if (fromQuery) {
        finalQuery = {
            from: fromQuery
        };
    }
    else if (toQuery) {
        finalQuery = {
            to: toQuery
        };
    }

    Message.find(finalQuery, function(err, messages) {
        return res.status(200).json(messages);
    }).populate('from to');
});

app.post("/messages", jsonParser, function(req, res) {
    var fromInput = req.body.from,
        toInput = req.body.to,
        textInput = req.body.text;

    if (!textInput) {
        return res.status(422).json({
            message: 'Missing field: text'
        });
    }
    else if (typeof textInput !== 'string') {
        return res.status(422).json({
            message: 'Incorrect field type: text'
        });
    }
    else if (typeof toInput !== 'string') {
        return res.status(422).json({
            message: 'Incorrect field type: to'
        });
    }
    else if (typeof fromInput !== 'string') {
        return res.status(422).json({
            message: 'Incorrect field type: from'
        });
    }else if (!mongoose.Types.ObjectId.isValid(fromInput)) {
        return res.status(422).json({
                message: 'Incorrect field value: from'
            });
    }else if (!mongoose.Types.ObjectId.isValid(toInput)) {
        return res.status(422).json({
                message: 'Incorrect field value: to'
            });
    }
    
    

    // User.find({
    //     _id: fromInput
    // }, function(err, user) {

    //     if (!user.length) {
    //         return res.status(422).json({
    //             message: 'Incorrect field value: from'
    //         });
    //     }
        // User.find({
        //     _id: toInput
        // }, function(err, user) {

        //     if (!user.length) {
        //         return res.status(422).json({
        //             message: 'Incorrect field value: to'
        //         });
            // }
            Message.create({
                    text: textInput,
                    from: fromInput,
                    to: toInput
                },function(err, message) {

                    return res.status(201).location('/messages/' + message._id).json({});
                });
        // });

    // }); //closes first user.find

}); //closes post

app.get('/messages/:messageId', jsonParser, function(req, res) {
    var messageID = req.params.messageId;

    Message.findById(messageID, function(err, message) {
        if (!message) {
            return res.status(404).json({
                message: 'Message not found'
            });
        }
        return res.status(200).json(message);
    }).populate('from to')
});

exports.app = app;
exports.runServer = runServer;