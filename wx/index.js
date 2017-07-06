'use strict'
var Wechat = require('../wechat/wechat');
var path = require('path');
var wechat_file = path.join(__dirname, '../config/wechat.txt');
var ticket_file = path.join(__dirname, '../config/ticket.txt');
var util = require('../libs/util');
var config = {
    wechat: {
        appID: 'wx80570191af294301',
        appSecret: '2482f0d502f6ae037f80557158910d50',
        token: 'yangxianchen123',
        getAccessToken: function() {
            return util.readFileAsync(wechat_file);
        },
        saveAccessToken: function(data) {
            var data = JSON.stringify(data);
            return util.writeFileAsync(wechat_file, data);
        },
        getTicket: function() {
            return util.readFileAsync(ticket_file);
        },
        saveTicket: function(data) {
            var data = JSON.stringify(data);
            return util.writeFileAsync(ticket_file, data);
        }
    }
};
exports.getWechat = function() {
    var wechatApi = new Wechat(config.wechat);
    return wechatApi;
}
exports.config = config.wechat;