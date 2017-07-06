const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const MovieSchema = new Schema({
    category: {
        type: ObjectId,
        ref: 'Category'
    },
    director: String,
    title: String,
    language: String,
    doubanId: String,
    genres: [String],
    country: String,
    summary: String,
    flash: String,
    poster: String,
    year: Number,
    pv: {
        type: Number,
        defualt: 0
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
MovieSchema.pre('save', function(next) {
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now();
    }
    else {
        this.meta.updateAt = Date.now();
    }
    next();
});
MovieSchema.statics = {
    fetch: function(cb) {
        return this
            .find({})
            .sort('meta.updateAt')
            .exec(cb);
    },
    findById: function(id,cb) {
        return this
            .findOne({_id: id})
            .exec(cb);

    }
};
module.exports = MovieSchema;