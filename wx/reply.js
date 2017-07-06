'use strict'
var path = require('path');
var Movie = require('../app/api/movie');
var currentDomain = 'http://1089d6c0.ngrok.io';
var help = '欢迎关注个人的微信试验场！\n' +
    '回复1-3，测试文字回复\n' +
    '回复4，测试图文回复\n' +
    '回复 首页，进入电影首页\n' +
    '回复 登陆，进入微信登陆绑定\n' +
    '回复 游戏，进入游戏页面\n' +
    '回复 电影名字，查询电影信息\n' +
    '回复 语音，查询电影信息\n' +
    '也可以点击<a href="'+currentDomain+'/wechat/movie">语音查电影</a>';
exports.reply = function* (next) {
    var message = this.weixin;
    if(message.MsgType === 'event') {
        if(message.Event === 'subscribe') {
            if(message.EventKey) {
                console.log('扫描二维码进来：' + message.EventKey + ' ' + message.ticket);
            }
            reply = help;
        }
        else if(message.Event === 'unsubscribe') {
            console.log('取消关注！');
            reply = '';
        }
        else if(message.Event === 'LOCATION') {
            reply = '您上报的位置是：' + message.Latitude + '/' + message.Longitude + '-' + message.Precision;
        }
        else if(message.Event === 'CLICK') {
            var news = [];
            if(message.EventKey === 'movie_hot') {
                let movies = yield Movie.findHotMovies(-1, 5);
                movies.forEach(function(movie) {
                    news.push({
                        title: movie.title,
                        description: movie.title,
                        picUrl: movie.poster,
                        url: currentDomain + '/wechat/jump/' + movie._id
                    });
                });
            }
            else if (message.EventKey === 'movie_cold') {
                let movies = yield Movie.findHotMovies(1, 5)

                movies.forEach(function(movie) {
                    news.push({
                        title: movie.title,
                        description: movie.title,
                        picUrl: movie.poster,
                        url: currentDomain + '/wechat/jump/' + movie._id
                    })
                })
            }
            else if (message.EventKey === 'movie_crime') {
                let cat = yield Movie.findMoviesByCate('犯罪');
                if (cat) {
                    cat.movies.forEach(function(movie) {
                        news.push({
                            title: movie.title,
                            description: movie.title,
                            picUrl: movie.poster,
                            url: currentDomain + '/wechat/jump/' + movie._id
                        })
                    });
                }
                else {
                    news = '该分类下无电影！';
                }

            }
            else if (message.EventKey === 'movie_cartoon') {
                let cat = yield Movie.findMoviesByCate('动画');
                if (cat) {
                    cat.movies.forEach(function(movie) {
                        news.push({
                            title: movie.title,
                            description: movie.title,
                            picUrl: movie.poster,
                            url: currentDomain + '/wechat/jump/' + movie._id
                        })
                    });
                }
                else {
                    news = '该分类下无电影！';
                }

            }
            else if (message.EventKey === 'help') {
                news = help;
            }
            reply = news;
        }
        else if(message.Event === 'SCAN') {
            console.log('关注后扫二维码' + message.EventKey + ' ' + message.Ticket);
            reply = '看到你扫了一下呃！';
        }
        else if(message.Event === 'VIEW') {
            reply = '你点击了菜单中的链接：' + message.EventKey;
        }
        else if(message.Event === 'scancode_push') {
            reply = '你点击了菜单中的链接：' + message.EventKey;
        }
        else if(message.Event === 'scancode_waitmsg') {
            reply = '你点击了菜单中的链接：' + message.EventKey;
        }
        else if(message.Event === 'pic_sysphoto') {
            reply = '你点击了菜单中的链接：' + message.EventKey;
        }
        else if(message.Event === 'pic_weixin') {
            reply = '你点击了菜单中的链接：' + message.EventKey;
        }
        else if(message.Event === 'location_select') {
            reply = '你点击了菜单中的链接：' + message.EventKey;
            reply = '你点击了菜单中的链接：' + message.EventKey;
        }
    }
    else if (message.MsgType === 'voice'){
        var voiceText = message.Recognition;
        var movies = yield Movie.searchByName(voiceText);
        if(!movies || movies.length === 0) {
            movies = yield Movie.searchByDouban(voiceText);
        }
        if(movies && movies.length > 0) {
            reply = [];
            movies = movies.slice(0, 5);
            movies.forEach(function(movie) {
                reply.push({
                    title: movie.title,
                    description: movie.title,
                    picUrl: movie.poster,
                    url: currentDomain + '/wechat/jump/' + movie._id
                });
            });
        }
        else {
            reply = '没有查询到' + voiceText + '相关的电影!';
        }
    }
    else if (message.MsgType === 'text'){
        var content = message.Content;
        var reply = '你说的' + message.Content + '是什么啊！我无法理解啊！';
        if(content === '1') {
            reply = '天下第一吃大米！';
        }
        else if(content === '2') {
            reply = '天下第二吃韭菜！';
        }
        else if(content === '3') {
            reply = '天下第三吃萝卜！';
        }
        else if(content === '4') {
            reply = [
                {
                    title: '技术改变世界',
                    description: '只是个描述罢了',
                    picUrl: 'http://r3.ykimg.com/05160000530EEB63675839160D0B79D5',
                    url: 'https://github.com'
                },
                {
                    title: 'nodejs微信开发测试',
                    description: '无限坑',
                    picUrl: 'http://r3.ykimg.com/05160000530EEB63675839160D0B79D5',
                    url: 'https://nodejs.org'
                }
            ];
        }
        else {
            var movies = yield Movie.searchByName(content);
            if(!movies || movies.length === 0) {
                movies = yield Movie.searchByDouban(content);
            }
            if(movies && movies.length > 0) {
                reply = [];
                movies = movies.slice(0, 5);
                movies.forEach(function(movie) {
                    reply.push({
                        title: movie.title,
                        description: movie.title,
                        picUrl: movie.poster,
                        url: currentDomain + '/wechat/jump/' + movie._id
                    });
                });
            }
            else {
                reply = '没有查询到' + content + '相关的电影!';
            }
        }
    }
    this.body = reply;

    yield next;
};