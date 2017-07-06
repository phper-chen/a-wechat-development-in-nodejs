'use strict'
const wx = require('../../wx/index');
const util = require('../../libs/util');
const Movie = require('../api/movie');
const koa_request = require('koa-request');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Comment = mongoose.model('Comment');
exports.guess = function* (next) {
    var wechatApi = wx.getWechat();
    var data = yield wechatApi.fetchAccessToken();
    var access_token = data.access_token;
    var ticketData = yield wechatApi.fetchTicket(access_token);
    var ticket = ticketData.ticket;
    var url = this.href;
    console.log(this.href);
    var params = util.sign(ticket, url);
    yield this.render('wechat/game', params);

};
exports.jump = function* (next) {
    var movieId = this.params.id;
    var redirect = 'http://4e2974d9.ngrok.io/wechat/movie/' + movieId;
    var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + wx.config.appID + '&redirect_uri=' + redirect + '&response_type=code&scope=snsapi_base&state=' +movieId+ '#wechat_redirect';
    this.redirect(url);
};
exports.find = function* (next) {
    var code = this.query.code;
    var openUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + wx.config.appID + '&secret=' + wx.config.appSecret + '&code=' + code + '&grant_type=authorization_code';
    var response = yield koa_request({
        url: openUrl
    });
    var body = JSON.parse(response.body);
    var openid = body.openid;
    var user = yield User.findOne({openid: openid}).exec();
    if(! user) {
        user = new User({
            openid: openid,
            password: 'hahanice',
            name: Math.random().toString(36).substr(2)
        });
        user = yield user.save();
    };
    this.session.user = user;
    this.state.user = user;

    var id = this.params.id;
    var wechatApi = wx.getWechat();
    var data = yield wechatApi.fetchAccessToken();
    var access_token = data.access_token;
    var ticketData = yield wechatApi.fetchTicket(access_token);
    var ticket = ticketData.ticket;
    var url = this.href;
    var params = util.sign(ticket, url);
    var movie = yield Movie.searchById(id);
    params.movie = movie;
    params.comments = yield Comment
        .find({movie: id})
        .populate('from', 'name')
        .populate('reply.from reply.to', 'name')
        .exec();
    yield this.render('wechat/movie', params);
};