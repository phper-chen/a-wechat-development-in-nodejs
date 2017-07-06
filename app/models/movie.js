const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const MovieSchema = require('../schemas/movie');
const Movie = mongoose.model('Movie',MovieSchema);
module.exports = Movie;