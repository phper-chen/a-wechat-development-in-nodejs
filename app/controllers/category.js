'use strict'
const mongoose = require('mongoose');
const Category = mongoose.model('Category');
exports.save = function* () {
    yield this.render('pages/category_admin', {
        title: 'imooc 分类录入页'
    });
}
exports.new = function* () {
    var categoryObj = this.body.category;
    var _category = new Category(categoryObj);
    yield _category.save();
    this.redirect('/admin/categorylist');

}
exports.list = function* () {
    var categories = yield Category.find({}).exec();
    yield this.render('pages/categorylist', {
        title: 'imooc 分类列表页',
        categories: categories
    });
}