'use strict'

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var util = require('./util');
var fs = require('fs');
var _ = require('lodash');
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var mpPrefix = 'https://mp.weixin.qq.com/cgi-bin/';
var semanticUrl = 'https://api.weixin.qq.com/semantic/semproxy/search?';
var api = {
    accessToken: prefix + 'token?grant_type=client_credential',
    temUpload: prefix + 'media/upload?',
    temGet: prefix + 'media/get?',
    permanent: {
        addNews: prefix + 'material/add_news?',
        addPic: prefix + 'media/uploadimg?',
        addMaterial: prefix + 'material/add_material?',
        getMaterial: prefix + 'material/get_material?',
        del: prefix + 'material/del_material？',
        update: prefix + 'material/update_news?',
        count: prefix + 'material/get_materialcount?',
        batch: prefix + 'material/batchget_material?'
    },
    tag: {
        create: prefix + 'tags/create?',
        get: prefix + 'tags/get?',
        check: prefix + 'tags/getidlist?',
        update: prefix + 'tags/update?',
        del: prefix + 'tags/delete?'
    },
    user: {
        remark: prefix + 'user/info/updateremark?',
        get: prefix + 'user/info?',
        batch: prefix + 'user/info/batchget?',
        list: prefix + 'user/get?'
    },
    mass: {
        preview: prefix + 'message/mass/preview?'
    },
    menu: {
        create: prefix + 'menu/create?',
        get: prefix + 'menu/get?',
        del: prefix + 'menu/delete?',
        option: prefix + 'get_current_selfmenu_info?'
    },
    qrcode: {
        create: prefix + 'qrcode/create?',
        show: mpPrefix + 'showqrcode?'
    },
    shortUrl: prefix + 'shorturl?',
    ticket: prefix + 'ticket/getticket?'

};
function Wechat(opts) {
    this.appID = opts.appID;
    this.appSecret = opts.appSecret;
    this.getAccessToken = opts.getAccessToken;
    this.saveAccessToken = opts.saveAccessToken;
    this.getTicket = opts.getTicket;
    this.saveTicket = opts.saveTicket;
    this.fetchAccessToken();
}
Wechat.prototype.isValidAccessToken = function(data) {
    if(! data || ! data.access_token || ! data.expires_in) return false;
    var access_token = data.access_token;
    var expires_in = data.expires_in;
    var now = (new Date().getTime());
    if(now < expires_in) {
        return true;
    }
    else{
        return false;
    }
}
Wechat.prototype.updateAccessToken = function() {
    var appID = this.appID;
    var appSecret = this.appSecret;
    var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret;
    return new Promise(function(resolve, reject) {
        request({url: url, json: true}).then(function(response) {
            var data = response.body;
            var now = (new Date().getTime());
            var expires_in = now + (data.expires_in - 20) * 1000;
            data.expires_in = expires_in;
            resolve(data);
        });
    });

}
Wechat.prototype.fetchAccessToken = function() {
    if(this.access_token || this.expires_in) {
        if(this.isValidAccessToken(this)) {
            return Promise.resolve(this);
        }
    }
    var that = this;
    return this.getAccessToken()
        .then(function(data) {
            try {
                data = JSON.parse(data);
            }
            catch(e) {
                return that.updateAccessToken();
            }
            if(that.isValidAccessToken(data)) {
                return Promise.resolve(data);
            }
            else{
                return that.updateAccessToken();
            }
        })
        .then(function(data) {
            that.access_token = data.access_token;
            that.expires_in = data.expires_in;
            that.saveAccessToken(data);
            return Promise.resolve(data);
        });
}
Wechat.prototype.reply = function() {
    var content = this.body;
    var message = this.weixin;
    var xml = util.tpl(content, message);
    this.status = 200;
    this.type = 'application/xml';
    this.body = xml;
}
Wechat.prototype.uploadMaterial = function(type, material, permanent) {
    var that = this;
    var form = {};
    var uploadUrl = api.temUpload;
    if (permanent) {
        uploadUrl = api.permanent.addMaterial;
        _.extend(form, permanent);
    }
    if (type === 'pic') {
        uploadUrl = api.permanent.addPic;
    }
    if (type === 'news') {
        uploadUrl = api.permanent.addNews;
        form = material;
    }
    else {
        form.media = fs.createReadStream(material);
    }

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = uploadUrl + 'access_token=' + data.access_token;
                if (!permanent) {
                    url += '&type=' + type;
                }
                else {
                    form.acess_token = data.access_token;
                }
                var options = {
                    method: 'POST',
                    url: url,
                    json: true
                };
                if (type === 'news') {
                    options.body = form;
                }
                else {
                    options.formData = form;
                }
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Upload material is failed');
                    }
                }).catch(function (err) {
                    reject(err);
                });
            });
    });
}
Wechat.prototype.fetchMaterial = function(mediaId, type, permanent) {
    var that = this;
    var getUrl = api.temGet;
    if (permanent) {
        getUrl = api.permanent.getMaterial;
    }

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = getUrl + 'access_token=' + data.access_token;
                var options = {
                    method: 'POST',
                    url: url,
                    json: true
                };
                if (permanent) {
                    var form = {
                        media_id: mediaId,
                        access_token: data.access_token
                    };
                    options.body = form;
                }
                else {
                    if (type === 'video') {
                        url = url.replace('https:', 'http:');
                    }
                    url += '&media_id=' + mediaId;
                }

                if(type === 'news' || type === 'video') {
                    request(options).then(function(response) {
                        var _data = response.body;
                        if(_data) {
                            resolve(_data);
                        }
                        else {
                            throw new Error('Upload material is failed');
                        }
                    }).catch(function (err) {
                        reject(err);
                    });
                }
                else {
                    resolve(url);
                }
            });
    });
}
Wechat.prototype.delMaterial = function(mediaId) {
    var that = this;
    var form = {
        media_id: mediaId
    };

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.permanent.del + 'access_token=' + data.access_token + '&media_id=' + mediaId;
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: form
                };
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Upload material is failed');
                    }
                }).catch(function (err) {
                    reject(err);
                });

            });
    });
}
Wechat.prototype.updateMaterial = function(mediaId, news) {
    var that = this;
    var form = {
        media_id: mediaId
    };
    _.extend(form, news);

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.permanent.update + 'access_token=' + data.access_token + '&media_id=' + mediaId;
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: form
                };
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Upload material is failed');
                    }
                }).catch(function (err) {
                    reject(err);
                });

            });
    });
}
Wechat.prototype.countMaterial = function() {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.permanent.count + 'access_token=' + data.access_token;
                var options = {
                    method: 'GET',
                    url: url,
                    json: true
                };
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Upload material is failed');
                    }
                }).catch(function (err) {
                    reject(err);
                });

            });
    });
}
Wechat.prototype.batchMaterial = function(options) {
    var that = this;
    var ops = {};
    ops.type = options.type || 'image';
    ops.offset = options.offset || 0;
    ops.count = options.count || 1;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.permanent.batch + 'access_token=' + data.access_token;
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: ops
                };
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Upload material is failed');
                    }
                }).catch(function (err) {
                    reject(err);
                });

            });
    });
}
Wechat.prototype.createTag = function(name) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.tag.create + 'access_token=' + data.access_token;
                var op = {
                    tag: {
                        name: name
                    }
                };
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: op
                }
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Upload material is failed');
                    }
                }).catch(function(err) {
                    reject(err);
                });
            })
    });
}
Wechat.prototype.getTag = function() {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.tag.get + 'access_token=' + data.access_token;
                var options = {
                    url: url,
                    json: true
                };
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Upload material is failed');
                    }
                }).catch(function(err) {
                    reject(err);
                });
            })
    });
}
Wechat.prototype.checkUserTaglist = function(openId) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.tag.check + 'access_token=' + data.access_token;
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: {
                        openid: openId
                    }
                };
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Upload material is failed');
                    }
                }).catch(function(err) {
                    reject(err);
                });
            })
    });
}
Wechat.prototype.updateTag = function(id, name) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.tag.update + 'access_token=' + data.access_token;
                var op = {
                    tag: {
                        id: id,
                        name: name
                    }
                };
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: op
                }
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Upload material is failed');
                    }
                }).catch(function(err) {
                    reject(err);
                });
            })
    });
}
Wechat.prototype.deleteTag = function(id) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.tag.delete + 'access_token=' + data.access_token;
                var op = {
                    tag: {
                        id: id
                    }
                };
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: op
                }
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Upload material is failed');
                    }
                }).catch(function(err) {
                    reject(err);
                });
            })
    });
}

Wechat.prototype.remark = function(user) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.user.remark + 'access_token=' + data.access_token;
                var op = {
                    openid: user.openid,
                    remark: user.remark

                };
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: op
                }
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('adding remark is failed');
                    }
                }).catch(function(err) {
                    reject(err);
                });
            })
    });
}
Wechat.prototype.userInfo = function(openids) {
    var that = this;
    var lang = 'zh_CN';
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var options = {
                    json: true
                }
                if(_.isArray(openids)) {
                    options.url = api.user.batch + 'access_token=' + data.access_token;
                    options.method = 'POST';
                    options.body = {
                        user_list: openids
                    };
                }
                else {
                    options.url = api.user.get + 'access_token=' + data.access_token + '&openid=' + openids + '&lang=' + lang;

                }
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('adding remark is failed');
                    }
                }).catch(function(err) {
                    reject(err);
                });
            })
    });
}

Wechat.prototype.listUsers = function(openid) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.user.list + 'access_token=' + data.access_token;
                console.log(data.access_token);
                if (openid) {
                    url += url + '&next_openid=' + openid;
                }
                var options = {
                    url: url,
                    json: true
                };
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Getting userslist is failed');
                    }
                }).catch(function(err) {
                    reject(err);
                });
            })
    });
}
Wechat.prototype.preview = function(type, message, openid) {
    var that = this;
    var msg = {
        msgtype: type,
        touser: openid
    };
    msg[type] = message;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.mass.preview + 'access_token=' + data.access_token;
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: msg
                };
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Preview is failed');
                    }
                }).catch(function(err) {
                    reject(err);
                });
            });
    });
}

Wechat.prototype.createMenu = function(menu) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.menu.create + 'access_token=' + data.access_token;
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: menu
                };
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Create menu failed');
                    }
                }).catch(function(err) {
                    reject(err);
                });
            });
    });
}

Wechat.prototype.getMenu = function() {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.menu.get + 'access_token=' + data.access_token;
                var options = {
                    url: url,
                    json: true
                };
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Get menu failed');
                    }
                }).catch(function(err) {
                    reject(err);
                });
            });
    });
}

Wechat.prototype.delMenu = function() {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.menu.del + 'access_token=' + data.access_token;
                var options = {
                    url: url,
                    json: true
                };
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Del menu failed');
                    }
                }).catch(function(err) {
                    reject(err);
                });
            });
    });
}
Wechat.prototype.optionMenu = function() {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.menu.option + 'access_token=' + data.access_token;
                var options = {
                    url: url,
                    json: true
                };
                request(options).then(function(response) {
                    var _data = response.body;
                    if(_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Get menu options failed');
                    }
                }).catch(function(err) {
                    reject(err);
                });
            });
    });
}
Wechat.prototype.createQrcode = function(qr) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.qrcode.create + 'access_token=' + data.access_token;
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: qr
                };
                request(options).then(function (response) {
                    var _data = response.body;
                    if (_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Create qrcode fails');
                    }
                })
                    .catch(function (err) {
                        reject(err);
                    });
            });
    });
}
Wechat.prototype.showQrcode = function(ticket) {
    return new Promise(function(resolve, reject) {

        var url = api.qrcode.create + 'ticket=' + ticket;
        var options = {
            url: url,
            json: true
        };
        request(options).then(function (response) {
            var _data = response.body;
            if (_data) {
                resolve(_data);
            }
            else {
                throw new Error('Getting qrcode fails');
            }
        })
            .catch(function (err) {
                reject(err);
            });
    });
}
Wechat.prototype.long2short = function(rawurl) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.shortUrl + 'access_token=' + data.access_token;
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: {
                        action: 'long2short',
                        long_url: rawurl
                    }
                };
                request(options).then(function (response) {
                    var _data = response.body;
                    if (_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Create short fails');
                    }
                })
                    .catch(function (err) {
                        reject(err);
                    });
            });
    });
}

Wechat.prototype.semantic = function(semanticData) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = semanticUrl + 'access_token=' + data.access_token;
                semanticData.appid = data.appID;
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: semanticData
                };
                request(options).then(function (response) {
                    var _data = response.body;
                    if (_data) {
                        resolve(_data);
                    }
                    else {
                        throw new Error('Create voice fails');
                    }
                })
                    .catch(function (err) {
                        reject(err);
                    });
            });
    });
}

Wechat.prototype.fetchTicket = function(access_token) {

    var that = this;
    return this.getTicket()
        .then(function(data) {
            try {
                data = JSON.parse(data);
            }
            catch(e) {
                return that.updateTicket(access_token);
            }
            if(that.isValidTicket(data)) {
                return Promise.resolve(data);
            }
            else{
                return that.updateTicket(access_token);
            }
        })
        .then(function(data) {
            that.saveTicket(data);
            return Promise.resolve(data);
        });
}

Wechat.prototype.updateTicket = function(access_token) {
    var url = api.ticket + '&access_token=' + access_token + '&type=jsapi';
    return new Promise(function(resolve, reject) {
        request({url: url, json: true}).then(function(response) {
            var data = response.body;
            var now = (new Date().getTime());
            var expires_in = now + (data.expires_in - 20) * 1000;
            data.expires_in = expires_in;
            resolve(data);
        });
    });
}

Wechat.prototype.isValidTicket = function(data) {
    if(! data || ! data.ticket || ! data.expires_in) return false;
    var ticket = data.ticket;
    var expires_in = data.expires_in;
    var now = (new Date().getTime());
    if(ticket && now < expires_in) {
        return true;
    }
    else{
        return false;
    }
}
module.exports = Wechat;