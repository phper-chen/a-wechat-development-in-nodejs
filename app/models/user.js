const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const UserSchema = require('../schemas/user');
const User = mongoose.model('User',UserSchema);
module.exports = User;