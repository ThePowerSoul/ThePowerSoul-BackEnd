var Comment = require('../models/comment');
var express = require('express');
var router = express.Router();
var uuid = require('node-uuid');

function likeTheComment(comment_id, user_id, res) {
    var likeCommentPromise = Comment.update({_id: comment_id}, {$push: {"LikeUser": user_id}});
    likeCommentPromise.then(function(data) {
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
}

function dislikeTheComment(comment_id, user_id, res) {
    var dislikeCommentPromise = Comment.update({_id: comment_id}, {$push: {"DislikeUser": user_id}});
    dislikeCommentPromise.then(function(data) {
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
}

function removeFromLikeList(comment_id, user_id, res) {
    var removeLikeCommentPromise = Comment.update({_id: comment_id}, {$pull: {"LikeUser": user_id}});
    return removeLikeCommentPromise.then(function(data) {
    }, function(error) {
        res.send(error);
    });
}

function removeFromDislikeList(comment_id, user_id, res) {
    var removeDislikeCommentPromise = Comment.update({_id: comment_id}, {$pull: {"DislikeUser": user_id}});
    return removeDislikeCommentPromise.then(function(data) {
    }, function(error) {
        res.send(error);
    });
}

// 点赞或者取消赞
router.likeOrDislike = function(req, res) {
    var user_id = req.params.user_id;
    var comment_id = req.params.comment_id;
    var operationType = req.params.operation_type;
    var findCommentPromise = Comment.find({_id: comment_id});
    findCommentPromise.then(function(data){
        if (operationType === "up") { // 点赞
            if (data[0].LikeUser.indexOf(user_id) >= 0) {
                res.send(400, "Added");
            } else {
                removeFromDislikeList(comment_id, user_id, res).then(likeTheComment(comment_id, user_id, res));
            }
        } else if (operationType === "down") { //取消赞
            if (data[0].DislikeUser.indexOf(user_id) >= 0) {
                res.send(400, "Removed");
            } else {
                removeFromLikeList(comment_id, user_id, res).then(dislikeTheComment(comment_id, user_id, res));
            }
        }
    }, function(error) {
        res.send(error);
    });
}

// 获得两个用户之前的评论情景对话
router.getConversation = function(req, res) {
    var context_id = req.params.context_id;
    var user_id = req.params.user_id;
    var target_user_id = req.params.target_user_id;
    var getCommentConversationPromise = Comment.find({"$or": 
        [{"TargetContextID": context_id, "UserID": user_id, "TargetUserID": target_user_id}, 
        {"TargetContextID": context_id, "UserID": target_user_id, "TargetUserID": user_id},
        {"TargetContextID": context_id, "UserID": target_user_id},
        {"TargetContextID": context_id, "UserID": user_id}]});
    getCommentConversationPromise.then(function(data) {
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
}

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
    var contextID = input.ContextID;
    var comment = new Comment();
    if (contextID === "") {
        comment.TargetContextID = uuid.v4();
        comment.TargetUserID = "";
        comment.TargetAuthor = "";
    } else {
        comment.TargetContextID = contextID;
        comment.TargetUserID = input.TargetUserID;
        comment.TargetAuthor = input.TargetAuthor;
    }
    comment.UserID = req.params.user_id;
    comment.TopicID = req.params.topic_id;
    comment.CreatedAt = new Date();
    comment.Content = input.Comment;
    // comment.Title = input.Title;
    comment.TargetAuthor = input.TargetAuthor; // 回复的对象
    comment.Author = input.Author;
    comment.Like = 0;
    comment.Dislike = 0;
    var addNewCommentPromise = comment.save();
    addNewCommentPromise.then(function(data) {
        res.json(200, data);
    }, function(error) {
        res.send(error);
    });
}

// 删除评论
router.deleteComment = function(req, res){
    var deleteCommentPromise = Comment.findByIdAndRemove(req.params.comment_id);
    deleteCommentPromise.then(function(data) {
        res.json(200, data);
    }, function(error) {
        res.send(error);
    });
}

module.exports = router;



