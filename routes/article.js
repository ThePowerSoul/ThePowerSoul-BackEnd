var Article = require('../models/article');
var express = require('express');
var path = require('path');
var fs = require('fs');
var formidable = require('formidable');
var oss = require('ali-oss');
var co = require('co');
var router = express.Router();
var accessid = 'LTAILjmmB1fnhHlx';
var accesskey = '2WWvSKQVLOLCto3UsdNVGdqfPOS2AG';
var ossClient = new oss.Wrapper({
    accessKeyId: accessid,
    accessKeySecret: accesskey,
    bucket: 'thepowersoul-richtexteditor',
    region: 'oss-cn-beijing'
});

router.setVideoPublic = function (req, res) {
    var key = req.body.Key;
    co(function* () {
        yield ossClient.putACL(key, 'public-read');
        var obj = yield ossClient.get(key);
        res.send(200, { Src: obj.res.requestUrls[0] });
        var result = yield ossClient.getACL(key);
    }).catch(function (err) {
        res.send(err);
    });
}

router.getVideoPreview = function (req, res) {
    var imgData = req.body.Data;
    var base64Data = imgData.replace(/^data:image\/png;base64,/, "");
    var binaryData = new Buffer(base64Data, 'base64').toString('binary');
    fs.writeFile("video-preview.png", binaryData, 'binary', function (err) {
        if (err) {
            res.send(err);
        } else {
            res.send("保存成功！");
        }
    });
}

router.getUploadPicture = function (req, res) {
    var form = new formidable.IncomingForm();
    var imagesRoot = path.join(process.cwd(), 'images');
    form.uploadDir = imagesRoot;
    form.keepExtensions = true;
    form.parse(req, function (err, fields, file) {
        var filePath = "";
        if (file.fileData) {
            filePath = file.fileData.path;
        } else {
            res.send(500, { success: false, msg: '图片上传失败，请重试' });
        }
        var fileExtension = filePath.substring(filePath.lastIndexOf('.'));
        if (('.jpg.jpeg.png.gif').indexOf(fileExtension.toLowerCase()) < 0) {
            // 文件类型不合法
            res.send(500, '文件类型不合法');
        } else {
            // 上传文件到阿里云
            co(function* () {
                var key = new Date().getTime() + file.fileData.name; //文件名和时间戳共同命名文件
                var stream = fs.createReadStream(filePath);
                yield ossClient.put(key, stream);
                yield ossClient.putACL(key, 'public-read');
                var data = yield ossClient.get(key);
                var body = {
                    file_path: data.res.requestUrls[0],
                    success: true
                }
                res.send(200, body);
            })
                .then(function (value) {
                    fs.unlink(filePath); // 在文件系统中删除对应文件
                })
                .catch(function (err) {
                    res.send(500, { success: false, msg: '图片上传失败，请重试' });
                });
        }
    });
}

function likeTheArticle(article_id, user_id, res) {
    var likeArticlePromise = Article.update({ _id: article_id }, { $push: { "LikeUser": user_id } });
    likeArticlePromise.then(function (data) {
        res.send(200, data);
    }, function (error) {
        res.send(error);
    });
}

router.likeTheArticle = function (req, res) {
    var user_id = req.params.user_id;
    var article_id = req.params.article_id;
    var findArticlePromise = Article.find({ _id: article_id });
    findArticlePromise.then(function (data) {
        if (data[0].LikeUser.indexOf(user_id) >= 0) {
            res.send(400, "Added");
        } else {
            likeTheArticle(article_id, user_id, res);
        }
    }, function (error) {
        res.send(error);
    });
}

router.getHotArticles = function (req, res) {
    var article_id = req.params.article_id;
    var findArticlesPromise = Article.find({ _id: article_id });
    findArticlesPromise.then(function (data) {
        var result = calHotArticles(data);
        res.send(200, result);
    }, function (error) {
        res.send(error);
    });
}

function calHotArticles(arr) {
    arr.sort(function (a, b) {
        var valA = a.View + a.LikeUser.length * 2;
        var valB = b.View + b.LikeUser.length * 2;
        if (valA < valB) {
            return 1;
        } else if (valA == valB) {
            return 0;
        } else {
            return -1;
        }
    });
    return arr.slice(0, 6);
}

router.getArticles = function (req, res) {
    var input = req.body;
    var category = input.Category;
    var keyword = input.Keyword;
    var loadAll = input.LoadAll;
    var pageNum = req.body.PageNum;
    var getArticlePromise = Article.find();
    if (loadAll) {

    } else {

    }
    getArticlePromise.then(function (data) {
        data.sort(function (a, b) {
            return Date.parse(b.CreatedAt) - Date.parse(a.CreatedAt);
        });
        var skipNum = (pageNum - 1) * 5;
        var articles = data.slice(skipNum, skipNum + 5);
        res.send(200, articles);
    }, function (error) {
        res.send(error);
    });
}

router.getUserArticles = function (req, res) {
    var getUserArticlesPromise = Article.find({ UserID: req.params.user_id });
    getUserArticlesPromise.then(function (data) {
        res.send(200, data);
    }, function (error) {
        res.send(error);
    });
}

router.getArticle = function (req, res) {
    var getArticlePromise = Article.find({ _id: req.params.article_id });
    getArticlePromise.then(function (data) {
        if (data.length > 0) {
            res.send(200, data[0]);
        } else {
            res.send(404, "ArticleNotFound");
        }
    }, function (error) {
        res.send(error);
    });
}

router.addArticleView = function (req, res) {
    var addArticleViewPromise = Article.update({ _id: article_id }, { $inc: { 'View': 1 } });
    addArticleViewPromise.then(function (data) {
        res.send(200);
    }, function (error) {
        res.send(error);
    });
}

router.addNewArticle = function (req, res) {
    var input = req.body;
    var article = new Article();
    article.Content = input.Content;
    article.Title = input.Title;
    article.Author = input.Author;
    article.LikeUser = [];
    article.DislikeUser = [];
    article.Category = input.Category;;
    article.CreatedAt = new Date();
    article.UserID = req.params.user_id;
    article.IsArticle = true;
    article.View = 0;
    var addNewArticlePromise = article.save();
    addNewArticlePromise.then(function (data) {
        res.json(data);
    }, function (error) {
        res.send(error);
    });
}

router.deleteArticle = function (req, res) {
    var deleteArticlePromise = Article.findByIdAndRemove(req.params.article_id);
    deleteArticlePromise.then(function (data) {
        res.send(200, data);
    }, function (error) {
        res.send(error);
    });
}

module.exports = router;