// var app = require('koa')()
//   , logger = require('koa-logger')
//   , json = require('koa-json')
//   , views = require('koa-views')
//   , onerror = require('koa-onerror');
//
// var index = require('./routes/index');
// var users = require('./routes/users');
//
// // error handler
// onerror(app);
//
// // global middlewares
// app.use(views('views', {
//   root: __dirname + '/views',
//   default: 'jade'
// }));
// app.use(require('koa-bodyparser')());
// app.use(json());
// app.use(logger());
//
// app.use(function *(next){
//   var start = new Date;
//   yield next;
//   var ms = new Date - start;
//   console.log('%s %s - %s', this.method, this.url, ms);
// });
//
// app.use(require('koa-static')(__dirname + '/public'));
//
// // routes definition
// app.use(index.routes(), index.allowedMethods());
// app.use(users.routes(), users.allowedMethods());
//
// module.exports = app;
'use strict'
var Koa = require('koa');
const dbUrl = 'mongodb://localhost/imooc';
const fs = require('fs');
const moment = require('moment');
const mongoose = require('mongoose');
const path = require('path');
const staticServe = require('koa-static');
mongoose.connect(dbUrl);
const models_path = __dirname + '/app/models';
const walk = function(path) {
    fs
        .readdirSync(path)
        .forEach(function(file) {
            var newPath = path + '/' + file;
            var stat = fs.statSync(newPath);
            if(stat.isFile()) {
                if(/(.*)\.(js|coffee)/.test(file)) {
                    require(newPath);
                }
            }else if(stat.isDirectory()) {
                walk(newPath);
            }
        })
};
walk(models_path);
var menu = require('./wx/menu');
var wx = require('./wx/index');
var wechatApi = wx.getWechat();
wechatApi.delMenu().then(function() {
    return wechatApi.createMenu(menu);
})
.then(function(msg) {
    console.log(msg);
});

var app = new Koa();
var Router = require('koa-router');
var router = new Router();
var views = require('koa-views');
var session = require('koa-session');
var bodyParser = require('koa-bodyparser');
// console.log(path.join(__dirname, '.', 'public/upload'));
app.use(staticServe(path.join(__dirname, '.', 'public/upload')));
app.use(views(__dirname + '/app/views', {
    extension: 'pug',
    locals: {
        moment: moment
    }
}));
app.keys = ['yang'];
app.use(session(app));
app.use(bodyParser());
var User = mongoose.model('User');
app.use(function* (next) {
    var user = this.session.user;
    if(user && user._id) {
        this.session.user = yield User.findOne({_id: user._id}).exec();
        this.state.user = this.session.user;
    }
    else {
        this.state.user = null;
    }
    yield next;
});
require('./config/routes')(router);
app
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(3100);
console.log('Listening 3100');

