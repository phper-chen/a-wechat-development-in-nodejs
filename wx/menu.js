'use strict'
module.exports = {
    'button': [
        {
            "name": "排行榜",
            "sub_button": [
                {
                    "type": "click",
                    "name": "最热",
                    "key": "movie_hot"
                },
                {
                    "type": "click",
                    "name": "最冷的",
                    "key": "movie_cold"
                }
            ]
        },
        {
            "name": "分类",
            'sub_button': [
                {
                    "type":"click",
                    "name":"动画",
                    "key":"movie_cartoon"
                },
                {
                    "type":"click",
                    "name":"犯罪",
                    "key":"movie_crime"
                }
            ]

        },
        {
            "type":"click",
            "name":"帮助",
            "key":"help"
        }]
};