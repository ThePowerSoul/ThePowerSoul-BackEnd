var ArticleDraft = require('../models/article-draft');
var express = require('express');
var router = express.Router();

router.getUserArticleDrafts = function(req, res){
    var getUserArticleDraftsPromise =  ArticleDraft.find({UserID: req.params.user_id});
    getUserArticleDraftsPromise.then(function(data) {
        console.log(data);
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
}

router.getArticleDraft = function(req, res) {
    var getArticleDraftPromise =  ArticleDraft.find({_id: req.params.article_draft_id});
    getArticleDraftPromise.then(function(data) {
        res.send(200, data[0]);
    }, function(error) {
        res.send(error);
    });
}

router.updateArticleDraft = function(req, res) {
    var article_draft_id = req.params.article_draft_id;
    var newTitle = req.body.Title;
    var newCategory = req.body.Category;
    var newContent = req.body.Content;
    var updateArticleDraftPormise = ArticleDraft.update({_id: article_draft_id}, {"$set": 
        {"Title": newTitle, "Category": newCategory, "Content": newContent}});
    updateArticleDraftPormise.then(function(data) {
        res.send(200, data);
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
    article.Category = input.Category;
    article.CreatedAt = new Date();
    article.UserID = req.params.user_id;
    var addNewArticlePromise = article.save();
    addNewArticlePromise.then(function(data) {
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
}

router.deleteArticleDraft = function(req, res) {
    var deleteArticleDraftPromise = ArticleDraft.findByIdAndRemove(req.params.article_draft_id);
    deleteArticleDraftPromise.then(function(data) {
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
}

module.exports = router;