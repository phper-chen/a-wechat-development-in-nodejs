const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const CommentSchema = require('../schemas/comment');
const Comment = mongoose.model('Comment',CommentSchema);
module.exports = Comment;