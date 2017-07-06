const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const bcrypt = require('bcryptjs');
const SALT_WORK_FACTOR = 10;
const UserSchema = new mongoose.Schema({
    name: {
        unique: true,
        type: String
    },
    openid: String,
    password: String,
    // 0 normal user
    // 1 verified user
    // 2 perfect user
    // >10 admin
    // >50 super admin
    role: {
        type: Number,
        default: 0
    },
    meta: {
        createAt: {
            type: Date,
            default: Date.now()
        },
        updateAt: {
            type: Date,
            default: Date.now()
        }
    }
});
UserSchema.pre('save', function(next) {
    var user = this;
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now();
    }
    else {
        this.meta.updateAt = Date.now();
    }
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if(err) return next(err);
        bcrypt.hash(user.password, salt, function(err, hash) {
            if(err) return next(err);
            user.password = hash;
            next();
        });
    });
});
UserSchema.methods = {
    comparePassword: function(_password){
        var password = this.password;
        console.log(password);
        return function(cb) {
            bcrypt.compare(_password, password, function(err, isMatch) {
                cb(err, isMatch);
            });
        }
    }
},
UserSchema.statics = {
    findById: function(id,cb) {
        return this
            .findOne({_id: id})
            .exec(cb);

    }
};
module.exports = UserSchema;