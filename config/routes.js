'use strict'
const Router = require('koa-router');
const router = new Router();
const Index = require('../app/controllers/index');
const User = require('../app/controllers/user');
const Movie = require('../app/controllers/movie');
const Comment = require('../app/controllers/comment');
const Category = require('../app/controllers/category');
const Game = require('../app/controllers/game');
const Wechat = require('../app/controllers/wechat');
const koaBody = require('koa-body');
module.exports = function(router) {
    //pre handle user
    // router.use(function(req, res, next) {
    //     var _user = req.session.user;
    //     router.locals.user = _user;
    //     next();
    // });
//index
    router.get('/', Index.index);
//user
    router.post('/user/signup', User.signup);
    router.post('/user/signin', User.signin);
    router.get('/signup', User.showSignup);
    router.get('/signin', User.showSignin);
    router.get('/logout', User.logout);
    router.get('/admin/user/list', User.signinRequired, User.adminRequired, User.list);

    //wechat
    router.get('/wechat/movie', Game.guess);
    router.get('/wechat/movie/:id', Game.find);
    router.get('/wechat/jump/:id', Game.jump);
    router.get('/wx', Wechat.hear);
    router.post('/wx', Wechat.hear);
//movie
    router.get('/movie/:id', Movie.detail);
    router.get('/admin/movie', User.signinRequired, User.adminRequired, Movie.save);
    router.get('/admin/movie/update/:id', User.signinRequired, User.adminRequired, Movie.update);
    router.post('/admin/movie/new', User.signinRequired, User.adminRequired, koaBody({multipart: true}), Movie.savePoster, Movie.new);
    router.get('/admin/movie/list', User.signinRequired, User.adminRequired, Movie.list);
    router.delete('/admin/movie/list', Movie.del);
//comment
    router.post('/movie/comment', User.signinRequired, Comment.save);
//category
    router.get('/admin/category', User.signinRequired, User.adminRequired, Category.save);
    router.post('/admin/category/new', User.signinRequired, User.adminRequired, Category.new);
    router.get('/admin/categorylist', User.signinRequired, User.adminRequired, Category.list);
//results
    router.get('/results', Index.search);
};
