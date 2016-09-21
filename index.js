var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var app = express();
var User = require('./models/user');
var Message = require('./models/message');
var jsonParser = bodyParser.json();
var bcrypt = require('bcryptjs');
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;


// Add your API endpoints here
mongoose.Promise = global.Promise;

var strategy = new BasicStrategy(function(username, password, callback) {
    User.findOne({
        username: username
    }, function(err, user) {
        if (err) {
            callback(err);
            return;
        }
        if (!user) {
            return callback(null, false, {
                message: 'Incorrect username'
            });
        }

        user.validatePassword(password, function(err, isValid) {
            if (err) {
                return callback(err);
            }
            if (!isValid) {
                return callback(null, false, {
                    message: 'Incorrect password.'
                });
            }
            return callback(null, user);
        });
    });
});

passport.use(strategy);
app.use(passport.initialize());

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
}

app.get('/hidden', passport.authenticate('basic', {
    session: false
}), function(req, res) {
    res.json({
        message: 'Luke... I am your father'
    });
});


app.get('/users', passport.authenticate('basic', {
    session: false
}), function(req, res) {
    User.find({}, function(err, users) {
        if (err) {
            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }
        return res.json(users);
    });
});

app.post('/users', passport.authenticate('basic', {
    session: false
}), jsonParser, function(req, res) {
    if (!req.body) {
        return res.status(400).json({
            message: "No request body"
        });
    }

    if (!('username' in req.body)) {
        return res.status(422).json({
            message: 'Missing field: username'
        });
    }

    var username = req.body.username;

    if (typeof username !== 'string') {
        return res.status(422).json({
            message: 'Incorrect field type: username'
        });
    }

    username = username.trim();

    if (username === '') {
        return res.status(422).json({
            message: 'Incorrect field length: username'
        });
    }

    if (!('password' in req.body)) {
        return res.status(422).json({
            message: 'Missing field: password'
        });
    }

    var password = req.body.password;

    if (typeof password !== 'string') {
        return res.status(422).json({
            message: 'Incorrect field type: password'
        });
    }

    password = password.trim();

    if (password === '') {
        return res.status(422).json({
            message: 'Incorrect field length: password'
        });
    }

    bcrypt.genSalt(10, function(err, salt) {
        if (err) {
            return res.status(500).json({
                message: 'Interal server error'
            });
        }
        bcrypt.hash(password, salt, function(err, hash) {
            if (err) {
                return res.status(500).json({
                    message: 'Internal server error'
                });
            }

            var user = new User({
                username: username,
                password: hash
            });

            user.save(function(err,user) {
                if (err) {
                    return res.status(500).json({
                        message: 'Internal server error'
                    });
                }

                return res.status(201).location('/users/'+user._id).json({});
            });
        });
    });
});


// mongoose.connect('mongodb://localhost/auth').then(function() {
//     app.listen(process.env.PORT || 8080);
// });
//////-------------////////GET USER ID///////------------///////
app.get("/users/:userId", passport.authenticate('basic', {
    session: false
}), function(req, res) {
    var inputID = req.params.userId;
        User.findOne({
            _id: req.params.userId
        }, function(err, user) {
       
            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }
            if(req.user && inputID === req.user._id.toString()){
                return res.status(200).json(user);
            }
            return res.status(401).json({ message: "Unauthorized, bitch"});
        });
});
//adding password 
//update password
///////---------------///////PUT USERS ID//////-------------//////
app.put("/users/:userId", passport.authenticate('basic', {
    session: false
}), jsonParser, function(req, res) {
    var inputID = req.params.userId;
    var inputUsername = req.body.username;
    var inputPassword = req.body.password;
   if (typeof inputPassword !== 'string') {
            return res.status(422).json({
                    message: 'Incorrect field type: password'
                    });
    }
    if (inputID === req.user._id.toString()){
 
        bcrypt.genSalt(10, function(err, salt) {
            if (err) {
                return res.status(500).json({
                    message: 'Interal server error'
                });
            }
       
            bcrypt.hash(inputPassword, salt, function(err, hash) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error : The Password needs to be string'
                    });
                }
                User.findByIdAndUpdate(inputID, {
                    username: inputUsername,
                    password: hash
                }, {
                    upsert: true
                }, function(err, user) {
    
                    if (!inputUsername || !inputPassword) {
                        return res.status(422).json({
                            message: 'Missing field: username or password'
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
        });
    }
    else{
        console.log("unauthorizion ");
        return res.status(401).json({ message: "Unauthorized, bitch"});
    }
});
////-----------------------------DELEETEWTWFWEFWEC-------------/////////
app.delete("/users/:userId", passport.authenticate('basic', {
    session: false
}), jsonParser, function(req, res) {
    var inputID = req.params.userId;
    User.findByIdAndRemove(inputID, function(err, user) {
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        if(req.user && inputID === req.user._id.toString()){
                return res.status(200).json({});
            }
        return res.status(401).json({ message: "Unauthorized!!"});
    });
});
////----------------------///////////GET MESSAGES/////--------------//////////
//other users can’t send message with other userrname
app.get("/messages", passport.authenticate('basic', {
    session: false
}), function(req, res) {
    var fromQuery = req.query.from,
        toQuery = req.query.to,
        user = req.user,
        finalQuery;
    if (!fromQuery && !toQuery) {
        finalQuery = {
            $or: [{
                from: user._id
            }, {
                to: user._id
            }]
        };
    }

    else if (fromQuery && toQuery) {
        if (fromQuery == user._id || toQuery == user._id) {
            finalQuery = {
                from: fromQuery,
                to: toQuery
            };

        }else return res.json({
            message:'Unauthorized Request'
        });
    }
    else if (!fromQuery && toQuery != user._id) {
        finalQuery = {
            from: user._id,
            to: toQuery
        };
    }
    else if (!fromQuery || toQuery == user._id) {
        finalQuery = {
            to: user._id
        };
    }
    else if(!toQuery && fromQuery!=user._id){
       finalQuery = {
           from:fromQuery,
            to: user._id
        };  
    }else if(!toQuery && fromQuery==user._id){
       finalQuery = {
            from: user._id
        };  
    }
    Message
        .find(finalQuery)
        // .find({
        //     to:req.query.to || req.user._id,
        //     from:req.query.from||req.user._id
        //     })
        .populate('from to')
        .then(function(messages) {
            return res.status(200).json(messages);
        });
});
//////////////////////////POST MESSAGES////////////////////////
app.post("/messages", passport.authenticate('basic', {
    session: false
}), jsonParser, function(req, res) {
    var fromInput = req.user._id,
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
    // else if (typeof fromInput !== 'string') {
    //     return res.status(422).json({
    //         message: 'Incorrect field type: from'
    //     });
    //  }

    User.find({
        _id: fromInput
    }, function(err, user) {
     
        if (!user) {
            return res.status(422).json({
                message: 'Incorrect field value: from'
            });
        }
        User.find({
            _id: toInput
        }, function(err, user) {

            if (!user) {
                return res.status(422).json({
                    message: 'Incorrect field value: to'
                });
            }
            Message.create({
                text: textInput,
                from: req.user._id,
                to: toInput
            }, function(err, message) {

                return res.status(201).location('/messages/' + message._id).json({});
            });
        });

    }); //closes first user.find

}); //closes post

app.get('/messages/:messageId', passport.authenticate('basic', {
    session: false
}), jsonParser, function(req, res) {
    var messageID = req.params.messageId;

    Message.findById(messageID, function(err, message) {
        if (!message) {
            return res.status(404).json({
                message: 'Message not found'
            });
        }
        return res.status(200).json(message);
    }).populate('from to');
});

exports.app = app;
exports.runServer = runServer;