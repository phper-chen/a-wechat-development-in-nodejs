const Movie = require('../api/movie');
//index page
exports.index = function* (next) {
    // console.log(req.session.user);
    var categories = yield Movie.findAll();
    yield this.render('pages/index', {
        title: '我的电影 首页',
        categories: categories
    });

}
//search
exports.search = function* (next) {
    var catId = this.query.cat;
    var q = this.query.q;
    var page = parseInt(this.query.p, 10) || 0;
    const count = 2;
    var index = page*count;//从第几条开始
    if(catId) {
        var categories = yield Movie.searchByCategory(catId)
        yield this.render('pages/results', {
            title: '我的电影结果列表页面',
            keyword: category.name,
            currentPage: ~~page+1,
            query: 'cat=' + catId,
            totalPage: Math.ceil(movies.length/count),
            movies: results
        });
    }
    else {
        var movies = yield Movie.searchByName(q);
        yield this.render('pages/results', {
            title: '我的电影结果列表页面',
            keyword: q,
            currentPage: ~~page+1,
            query: 'cat=' + q,
            totalPage: Math.ceil(movies.length/count),
            movies: results
        });
    }

}