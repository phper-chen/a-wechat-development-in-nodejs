'use strict'
const mongoose = require('mongoose');
const Comment = mongoose.model('Comment');
//comment
exports.save = function* () {
    var _comment = this.request.body.comment;
    var movieId = _comment.movie;
    if(_comment.cid) {
        var comment = yield Comment.findOne({_id: _comment.cid}).exec();
        var reply = {
            from: _comment.from,
            to: _comment.tid,
            content: _comment.content
        };
        comment.reply.push(reply);
        yield comment.save();
        this.body = {success: 1};
    }
    else{
        var comment = new Comment({
            movie: _comment.movie,
            from: _comment.from,
            content: _comment.content
        });
        yield comment.save();
        this.body = {success: 1};
    }
}
//list
exports.list = function* () {
    var Comments = yield Comment.find({});
    yield this.render('list', {
        title: 'imooc 列表页',
        Comments: Comments
        // [{
        //  title:"机械战警",
        //  _id:1,
        //  doctor:'何塞.帕迪利亚',
        //  country:"美国",
        //  year:2014,
        //  poster:"http://r3.ykimg.com/05160000530EEB63675839160D0B79D5",
        //  language:"英语",
        //  flash:"http://player.youku.com/player.php/sid/XNjA1Njc0NTUy/v.swf",
        //  summary:"《机械战警》是由何塞·帕迪里亚执导，乔尔·金纳曼、塞缪尔·杰克逊、加里·奥德曼等主演的一部科幻电影，改编自1987年保罗·范霍文执导的同名电影。影片于2014年2月12日在美国上映，2014年2月28日在中国大陆上映。影片的故事背景与原版基本相同，故事设定在2028年的底特律，男主角亚历克斯·墨菲是一名正直的警察，被坏人安装在车上的炸弹炸成重伤，为了救他，OmniCorp公司将他改造成了生化机器人“机器战警”，代表着美国司法的未来。"
        //
        // }
        // ]

    });
}
//delete
exports.del = function* () {
    var id = this.query.id;
    if(id) {
        try {
            yield Comment.remove({_id: id}).exec();
            this.body = {success: 1};
        }
        catch(err) {
            this.body = {success: 0};
        }
    }
}