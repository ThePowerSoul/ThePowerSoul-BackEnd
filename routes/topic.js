var Topic = require('../models/topic');
var express = require('express');
var uuid = require('node-uuid');
var router = express.Router();

var mongoose = require('mongoose');
var uri = "mongodb://127.0.0.1:27017/thepowersouldb";
mongoose.connect(uri);
var db = mongoose.connection;

db.on('error',function(err){
    console.log('connection error', err);
});
db.once('openUri',function(){
    console.log('connected to database');
});

<<<<<<< HEAD
// 加载某个帖子的详情
router.getTopicDetail = function(req, res) {
    
}

// 首页根据条件加载帖子列表，后端分页
router.getTopics = function(req, res) {
    var input = req.body;
    var pageNum = input.Page;
    var category = input.Category;
    var keyword = input.Keyword;
    var LoadAll = input.LoadAll;
    if (LoadAll) {
        // 没有类别筛选
        // 直接根据关键字筛选
        if (keyword !== '') {
            // 根据关键字筛选后，再根据页数筛选
        } else {
            // 直接根据页数筛选
        }
    } else {
        // 有类别筛选
    }
=======
router.getTopics = function(req, res){
    var pageNum = req.input.Page;
    var category = req.input.Category;
    var keyword = req.input.Keywordl
    var loadAll = req.input.LoadAll;
    if (loadALl) {
        var getTopics = Topic.find();
        getTopics.then(function(data) {
            res.json(data);
        }, function(error) {
            res.send(error);
        });
    } else {

    }
    
>>>>>>> origin/master
}

// 找到对应用户发的所有帖子
router.getUserTopics = function(req, res){
    var getUserTopicsPromise = Topic.find({UserID: req.params.user_id});
    getUserTopicsPromise.then(function(data) {
        res.json(data);
    }, function(error) {
        res.send(error);
    });
}

// 用户发一个新帖子
router.addNewTopic = function(req, res){
    var input = req.body;
    var topic = new Topic();
    topic.UserID = req.params.user_id;
    topic.CreatedAt = new Date();
    topic.Content = input.Content;
    topic.Title = input.Title;
    topic.Author = input.Author;
    topic.Like = 0;
    topic.Dislike = 0;
    var addMewTopicPromise = topic.save();
    addMewTopicPromise.then(function(data) {
        res.json({message: "Add new topic successfully"});
    }, function(error) {
        res.send(error);
    });
}

// 删除一个帖子
router.deleteTopic = function(req, res){
    var deleteTopicPromise = Topic.findByIdAndRemove(req.params.topic_id);
    deleteTopicPromise.then(function(result) {
        res.json({message: "Delete topic successfully"});
    }, function(error) {
        res.send(error);
    });
}

module.exports = router;