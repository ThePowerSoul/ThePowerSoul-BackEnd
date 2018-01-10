var ComplaintMessage = require('../models/complaint-message');
var Article = require('../models/article');
var Topic = require('../models/topic');
var Comment = require('../models/comment');
var express = require('express');
var router = express.Router();

router.addNewComplaintMessage = function (req, res) {
    var user_id = req.params.user_id;
    var input = req.body;
    var type = req.body.Type;
    var target_id = req.body.TargetID;
    var complaintMesssage = new ComplaintMessage();
    complaintMesssage.UserID = user_id;
    complaintMesssage.Author = input.Author;
    complaintMesssage.Content = input.Content;
    complaintMesssage.TargetID = input.TargetID;
    complaintMesssage.TargetLink = target_id;
    complaintMesssage.Category = input.Category;
    complaintMesssage.TargetUserID = input.TargetUserID;
    complaintMesssage.CreatedAt = new Date();
    complaintMesssage.Status = "0";
    complaintMesssage.save()
        .then(function (data) {
            switch (type) {
                case 'ARTICLE':
                    var findArticlePromise = Article.find({ _id: target_id });
                    findArticlePromise.then(function (data) {
                        if (data[0].ReportUsers.indexOf(user_id) >= 0) {
                            res.send(400, '已存在');
                        } else {
                            Article.update({_id: target_id}, {$push: { "ReportUsers": user_id }})
                                .then(function(data) {
                                    res.send(200);
                                }, function(error) {
                                    res.send(error);
                                });
                        }
                    }, function (error) {
                        res.send(error);
                    });
                    break;
                case 'COMMENT':
                    var findCommentPromise = Comment.find({ _id: target_id });
                    findCommentPromise.then(function (data) {
                        if (data[0].ReportUsers.indexOf(user_id) >= 0) {
                            res.send(400, '已存在');
                        } else {
                            Comment.update({_id: target_id}, {$push: { "ReportUsers": user_id }})
                                .then(function(data) {
                                    res.send(200);
                                }, function(error) {
                                    res.send(error);
                                });
                        }
                    }, function (error) {
                        res.send(error);
                    });
                    break;
                case 'TOPIC':
                    var findTopicPromise = Topic.find({ _id: target_id }).lean();
                    findTopicPromise.then(function (data) {
                        if (data[0].ReportUsers.indexOf(user_id) >= 0) {
                            res.send(400, '已存在');
                        } else {
                            Topic.update({_id: target_id}, {$push: { "ReportUsers": user_id }})
                                .then(function(data) {
                                    res.send(200);
                                }, function(error) {
                                    res.send(error);
                                });
                        }
                    }, function (error) {
                        res.send(error);
                    });
                    break;
                default:
                    break;
            }
        }, function (error) {
            res.send(error);
        });
}

router.setRead = function (req, res) {
    var message_id = req.params.message_id;
    ComplaintMessage.update({ _id: message_id }, { '$set': { 'Status': '1' } })
        .then(function (data) {
            res.send(200, data);
        }, function (error) {
            res.send(error);
        });
}

router.getUnreadComplaintMessages = function (req, res) {
    ComplaintMessage.find({ 'Status': '0' }).then(function (data) {
        res.send(200, data);
    }, function (error) {
        res.send(error);
    });
}

router.getAllComplaintMessages = function (req, res) {
    ComplaintMessage.find().then(function (data) {
        res.send(200, data);
    }, function (error) {
        res.send(error);
    });
}

module.exports = router;