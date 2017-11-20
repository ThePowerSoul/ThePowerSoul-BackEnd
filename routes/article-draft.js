var ArticleDraft = require('../models/article-draft');
var express = require('express');
var router = express.Router();

router.getUserArticleDrafts = function(req, res){
    var getUserArticleDraftsPromise =  ArticleDraft.find({UserID: req.params.user_id});
    getUserArticleDraftsPromise.then(function(data) {
        res.json(data);
    }, function(error) {
        res.send(error);
    });
}

router.addNewArticleDraft = function(req, res){
    var input = req.body;
    var article = new ArticleDraft();
    article.Content = input.Content;
    article.Title = input.Title;
    article.Author = input.Author;
    article.Like = 0;
    article.Dislike = 0;
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

router.deleteArticleDraft = function(req, res) {
    var deleteArticleDraftPromise = ArticleDraft.findByIdAndRemove(req.params.article_draft_id);
    deleteArticleDraftPromise.then(function(data) {
        res.json(data);
    }, function(error) {
        res.send(error);
    });
}

module.exports = router;