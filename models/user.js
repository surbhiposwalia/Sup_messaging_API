var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
     password: {
        type: String,
        required: true
    }
});

var bcrypt = require('bcryptjs');

UserSchema.methods.validatePassword = function(password, callback) {
    bcrypt.compare(password, this.password, function(err, isValid){
        if(err) {
            callback(err);
            return;
        }
        callback(null, isValid);
    });
};

var User = mongoose.model('User', UserSchema);

module.exports = User;
