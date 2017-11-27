var Article = require('../models/article');
var express = require('express');
var router = express.Router();

router.getUserArticles = function(req, res){
    var getUserArticlesPromise =  Article.find({UserID: req.params.user_id});
    getUserArticlesPromise.then(function(data) {
        console.log(data);
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
}

router.getArticle = function(req, res) {
    var getArticlePromise =  Article.find({_id: req.params.article_id});
    getArticlePromise.then(function(data) {
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
}

router.addNewArticle = function(req, res){
    var input = req.body;
    var article = new Article();
    article.Content = input.Content;
    article.Title = input.Title;
    article.Author = input.Author;
    article.LikeUser = [];
    article.DislikeUser = [];
    article.Category = "";
    article.CreatedAt = new Date();
    article.UserID = req.params.user_id;
    var addNewArticlePromise = article.save();
    addNewArticlePromise.then(function(data) {
        res.json(data);
    }, function(error) {
        res.send(error);
    });
}

router.deleteArticle = function(req, res) {
    var deleteArticlePromise = Article.findByIdAndRemove(req.params.article_id);
    deleteArticlePromise.then(function(data) {
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
}

module.exports = router;