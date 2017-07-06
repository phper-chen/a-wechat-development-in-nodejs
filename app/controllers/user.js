'use strict'
const User = require('../models/user');
//showSignup
exports.showSignup = function* () {
    yield this.render('pages/signup', {
        title: '注册'
    });
}
//showSignin
exports.showSignin = function* () {
    yield this.render('pages/signin', {
        title: '登陆'
    })
}
//signup
exports.signup = function* (next) {
    var _user = this.request.body.user;
    var user = yield User.findOne({name: _user.name}).exec();
    if(user) {
        this.redirect('/signin');
        return next;
    }
    else{
        user = new User(_user);
        yield user.save();
        this.redirect('/');
    }

}
//signin
exports.signin = function* (next) {
    var _user = this.request.body.user;
    var name = _user.name;
    var password = _user.password;
    var user = yield User.findOne({name: name}).exec();
    if(! user) {
        this.redirect('/signup');
        return next;
    }
    var isMatch = yield user.comparePassword(password);
    if(isMatch) {
        console.log('password is matched');
        this.session.user = user;
        this.redirect('/');
    }
    else{
        console.log('password is not matched!');
        this.redirect('/signin');
    }
}
//logout
exports.logout = function* () {
    delete this.session.user;
    // delete app.locals.user;
    this.redirect('/');
}
//userlist
exports.list = function* () {
    var users = yield User.find({}).sort('meta.updateAt').exec();
    yield this.render('userlist', {
        title: 'imooc 用户列表页',
        users: users
    });
}
//midware for user
exports.signinRequired = function* (next) {
    var user = this.session.user;
    if(! user) {
        this.redirect('/signin');
    }
    else {
        yield next;
    }
}
//midware for admin
exports.adminRequired = function* (next) {
    var user = this.session.user;
    if(user.role < 10) {
        this.redirect('/');
    }
    else {
        yield next;
    }
}