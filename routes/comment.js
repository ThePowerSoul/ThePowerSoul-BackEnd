var Comment = require('../models/comment');
var express = require('express');
var router = express.Router();

//获取某帖子下所有评论
router.getTopicComments = function(req, res) {
    var getTopicCommentsPromise = Comment.find({TopicID: req.params.topic_id});
    getTopicCommentsPromise.then(function(data) {
        res.json(data);
    }, function(error) {
        res.send(error);
    });
}

// 添加新的评论
router.addNewComment = function(req, res){
    var input = req.body;
    var comment = new Comment();
    comment.TargetContextID = req.params.target_context_id; // 回复的上下文的id，第一次的话为null
    comment.UserID = req.params.user_id;
    comment.TopicID = req.params.topic_id;
    comment.CreatedAt = new Date();
    comment.Content = input.Content;
    comment.Title = input.Title;
    comment.TargetAuthor = input.TargetAuthor; // 回复的对象
    comment.Author = input.Author;
    comment.Like = 0;
    comment.Dislike = 0;
    var addNewCommentPromise = comment.save();
    addNewCommentPromise.then(function(data) {
        res.json({message: "Add new comment successfully"});
    }, function(error) {
        res.send(error);
    });
}

// 删除评论
router.deleteComment = function(req, res){
    var deleteCommentPromise = Comment.findByIdAndRemove(req.params.comment_id);
    deleteCommentPromise.then(function(data) {
        res.json({message: "Delete comment successfully"});
    }, function(error) {
        res.send(error);
    });
}

module.exports = router;



