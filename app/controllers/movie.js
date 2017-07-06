'use strict'
const mongoose = require('mongoose');
const Movie = mongoose.model('Movie');
const Comment = mongoose.model('Comment');
const Category = mongoose.model('Category');
const _ = require('lodash');
const path = require('path');
const util = require('../../libs/util');
//detail
exports.detail = function* (){
    // console.log('sdf--123');
    var id= this.params.id;  //url中的id
    yield Movie.update({_id: id}, {$inc: {pv: 1}}).exec();
    var movie = yield Movie.findOne({_id: id}).exec();
    var comments = yield Comment
            .find({movie: id})
            .populate('from', 'name')
            .populate('reply.from reply.to', 'name')
            .exec();
    yield this.render('pages/detail',{
        title:'imooc '+movie.title,
        movie: movie,
        comments: comments
    });

    // [{
    //  doctor:'何塞.帕迪利亚',
    //  country:"美国",
    //  title:"机械战警",
    //  year:2014,
    //  poster:" ",
    //  language:"英语",
    //  flash:"http://player.youku.com/player.php/sid/XNjA1Njc0NTUy/v.swf",
    //  summary:"《机械战警》是由何塞·帕迪里亚执导，乔尔·金纳曼、塞缪尔·杰克逊、加里·奥德曼等主演的一部科幻电影，改编自1987年保罗·范霍文执导的同名电影。影片于2014年2月12日在美国上映，2014年2月28日在中国大陆上映。影片的故事背景与原版基本相同，故事设定在2028年的底特律，男主角亚历克斯·墨菲是一名正直的警察，被坏人安装在车上的炸弹炸成重伤，为了救他，OmniCorp公司将他改造成了生化机器人“机器战警”，代表着美国司法的未来。"

    // }]
}
//admin
exports.save = function* () {
    var categories = yield Category.find({}).exec();
    yield this.render('admin', {
        title: 'imooc 后台录入页',
        categories: categories,
        movie:{
            category:"",
            title:"",
            doctor:"",
            country:"",
            year:"",
            poster:"",
            flash:"",
            summary:"",
            language:""
        }
    });
}
//admin update
exports.update = function* () {
    var id = this.params.id;
    if(id) {
        var categories = yield Category.find({}).exec();
        var movie = yield Movie.findOne({_id: id}).exec();
        yield this.render('pages/admin', {
            title: "immoc 后台更新页",
            movie: movie,
            categories: categories
        });
    }
}
//admin poster
exports.savePoster = function* (next) {
    if(this.request.body.files) {
        var posterData = this.request.body.files.uploadPoster;
        var filePath = posterData.path;
        var name = posterData.name;
        if(name) {
            var data = yield util.readFileAsync(filePath);
            var timestamp = Date.now();
            var type = posterData.type.split('/')[1];
            var poster = timestamp + '.' + type;
            var newPath = path.join(__dirname, '../../', '/public/upload/' + poster);
            yield util.writeFileAsync(newPath, data);
            this.poster = poster;
        }
    }
    yield next;

}
//admin post
exports.new = function* (next) {
    var movieObj = this.request.body.fields || {};
    var _movie;
    if(this.poster) {
        movieObj.poster = this.poster;
    }
    if(movieObj._id) {
        var movie = yield Movie.findOne({_id: movieObj._id}).exec();
        var oldCategory = movie.category;
        _movie = _.extend(movie, movieObj);
        if(movieObj.categoryName) {
            var category = new Category({
                name: movieObj.categoryName,
                movies: movie._id
            });
            var newcategory = yield category.save();
            _movie.category = newcategory._id;
            var movie = yield _movie.save();
            var category = yield Category.findOne({_id: oldCategory}).exec();
            for(var i=0;i<category.movies.length;i++) {
                if(movieObj._id == category.movies[i]) {
                    category.movies.splice(i,1);
                    break;
                }
            }
            yield category.save();
            this.redirect('/movie/' + movie._id);
        }
        else {
            var movie = yield _movie.save();
            var newCategory = movie.category;
            var category = yield Category.findOne({_id: newCategory}).exec();
            category.movies.push(movie._id);
            yield category.save();
            if(oldCategory != newCategory) {
                var category = yield Category.findOne({_id: oldCategory}).exec();
                for(var i=0;i<category.movies.length;i++) {
                    if(movieObj._id == category.movies[i]) {
                        category.movies.splice(i,1);
                        break;
                    }
                }
                yield category.save();
            }
            this.redirect('/movie/' + movie._id);

        }
    }
    else{
        _movie = new Movie(movieObj);
        var categoryId = movieObj.category;
        var movie = yield _movie.save();
        if(categoryId) {
            var category = yield Category.findOne({_id: categoryId}).exec();
            category.movies.push(movie._id);
            yield category.save();
            this.redirect('/movie/' + movie._id);
        }
        else if(movieObj.categoryName) {
            var category = new Category({
                name: movieObj.categoryName,
                movies: movie._id
            });
            var category = yield category.save();
            movie.category = category._id;
            var movie = yield movie.save();
            this.redirect('/movie/' + movie._id);
        }
    }
}
//list
exports.list = function* () {
    var movies = yield Movie.find({}).populate('category', 'name').exec();
    yield this.render('pages/list', {
        title: 'imooc 列表页',
        movies: movies
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
            yield Movie.remove({_id: id}).exec();
            this.body = {success: 1};
        }
        catch(err) {
            this.body = {success: 0};
        }
    }
}