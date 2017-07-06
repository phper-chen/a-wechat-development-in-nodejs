const Category = require('../models/category');
const Movie = require('../models/movie');
const koa_request = require('koa-request');
const Promise = require('bluebird');
const request = Promise.promisify(require('request'));
const co = require('co');
const _ = require('lodash');
function updateMovies(movie) {
    var options = {
        url: 'https://api.douban.com/v2/movie/subject/' + movie.doubanId,
        json: true
    };
    request(options).then(function(response) {
        var data = response.body;
        _.extend(movie, {
            country: data.countries[0],
            language: data.language,
            summary: data.summary
        });
        var genres = movie.genres;
        if (genres && genres.length > 0) {
            var cateArray = [];
            genres.forEach(function(genre) {
                cateArray.push(function* () {
                    var cat = yield Category.findOne({name: genre}).exec();
                    if (cat) {
                        cat.movies.push(movie._id);
                        yield cat.save();
                    }
                    else {
                        cat = new Category({
                            name: genre,
                            movies: [movie._id]
                        });
                        cat = yield cat.save();
                        movie.category = cat._id;
                        yield movie.save();
                    }
                });
            });
            co(function* () {
                yield cateArray;
            })
        }
        else {
            movie.save();
        }
    })
}
//index page
exports.findAll = function* () {
    // console.log(req.session.user);
    var categories = yield Category
        .find({})
        .populate({path: 'movies', options: {limit: 5}})
        .exec();
    return categories;
}
//search
exports.searchByCategory = function* (catId) {
    var categories = yield Category
        .find({_id: catId})
        .populate({
            path: 'movies',
            select: 'title poster'
        })
        .exec();
    return categories;
};
exports.searchByName = function* (name) {
    var movies = yield Movie
        .find({title: RegExp(name + '.*', 'i')})
        .exec();
    return movies;
};
exports.findHotMovies = function* (hot, count) {
  var movies = yield Movie
      .find({})
      .sort({'pv': hot})
      .limit(count)
      .exec();
  return movies;
};
exports.findMoviesByCate = function* (cat) {
    console.log(cat);
  var category = yield Category
      .findOne({name: cat})
      .populate({
          path: 'movies',
          select: 'title poster _id'
      })
      .exec();
  return category;
};
exports.searchById = function* (id) {
    var movie = yield Movie
        .findOne({_id: id})
        .exec();
    return movie;
};
exports.searchByDouban = function* (q) {
    var options = {
        url: 'https://api.douban.com/v2/movie/search?q=' + encodeURIComponent(q)
    };
    var response = yield koa_request(options);
    var data = JSON.parse(response.body);
    var subjects = [];
    var movies = [];
    if(data && data.subjects) {
        subjects = data.subjects;
    }
    if(subjects.length > 0) {
        var queryArray = [];
        subjects.forEach(function(item) {
            queryArray.push(function* () {
                var movie = yield Movie.findOne({doubanId: item.id});
                if(movie) {
                    movies.push(movie);
                }
                else {
                    var directors = item.directors || [];
                    var director = directors[0] || {};
                    movie = new Movie({
                        director: director.name || '',
                        title: item.title,
                        doubanId: item.id,
                        poster: item.images.large,
                        year: item.year,
                        genres: item.genres || []
                    });
                    movie = yield movie.save();
                    movies.push(movie);
                }
            });
        });
        yield queryArray;
        movies.forEach(function(movie) {
            updateMovies(movie);
        });
    }
    return movies;
}