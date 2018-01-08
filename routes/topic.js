var Topic = require('../models/topic');
var express = require('express');
var uuid = require('node-uuid');
var router = express.Router();

/*
 * 赞帖子
 */
function likeTheTopic(topic_id, user_id, res) {
    var likeTopicPromise = Topic.update({ _id: topic_id }, { $push: { "LikeUser": user_id } });
    likeTopicPromise.then(function (data) {
        res.send(200, data);
    }, function (error) {
        res.send(error);
    });
}

/*
 * 踩帖子
 */
function dislikeTheTopic(topic_id, user_id, res) {
    var dislikeTopicPromise = Topic.update({ _id: topic_id }, { $push: { "DislikeUser": user_id } });
    dislikeTopicPromise.then(function (data) {
        res.send(200, data);
    }, function (error) {
        res.send(error);
    });
}

function removeFromLikeList(topic_id, user_id, res) {
    var removeLikeTopicPromise = Topic.update({ _id: topic_id }, { $pull: { "LikeUser": user_id } });
    return removeLikeTopicPromise.then(function (data) {
    }, function (error) {
        res.send(error);
    });
}

function removeFromDislikeList(topic_id, user_id, res) {
    var removeDislikeTopicPromise = Topic.update({ _id: topic_id }, { $pull: { "DislikeUser": user_id } });
    return removeDislikeTopicPromise.then(function (data) {
    }, function (error) {
        res.send(error);
    });
}

/*
 * 点赞或者取消赞
 */
router.likeOrDislike = function (req, res) {
    var user_id = req.params.user_id;
    var topic_id = req.params.topic_id;
    var operationType = req.params.operation_type;
    var findTopicPromise = Topic.find({ _id: topic_id });
    findTopicPromise.then(function (data) {
        if (operationType === "up") { // 点赞
            if (data[0].LikeUser.indexOf(user_id) >= 0) {
                res.send(400, "Added");
            } else {
                removeFromDislikeList(topic_id, user_id, res).then(likeTheTopic(topic_id, user_id, res));
            }
        } else if (operationType === "down") { //取消赞
            if (data[0].DislikeUser.indexOf(user_id) >= 0) {
                res.send(400, "Removed");
            } else {
                removeFromLikeList(topic_id, user_id, res).then(dislikeTheTopic(topic_id, user_id, res));
            }
        }
    }, function (error) {
        res.send(error);
    });
}

/*
 * 帖子浏览量加1
 */
router.addTopicView = function (req, res) {
    var addTopicViewPromise = Topic.update({ _id: topic_id }, { $inc: { 'View': 1 } });
    addTopicViewPromise.then(function (data) {
        res.send(200);
    }, function (error) {
        res.send(error);
    });
}

/*
 * 加载某个帖子的详情
 */
router.getTopicDetail = function (req, res) {
    var topic_id = req.params.topic_id;
    var getTopicDetailPromise = Topic.find({ _id: topic_id });
    getTopicDetailPromise.then(function (data) {
        res.send(200, data[0]);
    }, function (error) {
        res.send(error);
    });
}

function calHotTopics(arr) {
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

/*
 * 获取热门的帖子
 */
router.getHotTopics = function (req, res) {
    var findTopicsPromise = Topic.find();
    findTopicsPromise.then(function (data) {
        var result = calHotTopics(data);
        res.send(200, result);
    }, function (error) {
        res.send(error);
    });
}

/*
 * 首页根据条件加载帖子列表，后端分页
 */
router.getTopics = function (req, res) {
    var input = req.body;
    var pageNum = input.Page;
    var category = input.Category;
    var keyword = input.Keyword;
    var LoadAll = input.LoadAll;
    if (LoadAll) {
        var getTopicsPromise = Topic.find();
        getTopicsPromise.then(function (data) {
            if (keyword !== '') { // 根据关键字筛选后，再根据页数筛选
                var newArr = [];
                data.forEach(function (topic) {
                    if (topic.Title.indexOf(keyword) >= 0) {
                        newArr.push(topic);
                    }
                });
                var skipNum = (pageNum - 1) * 5;
                var topics = newArr.slice(skipNum, skipNum + 5);
                res.send(200, topics);
            } else { // 直接根据页数筛选
                data.sort(function (a, b) {
                    return Date.parse(b.CreatedAt) - Date.parse(a.CreatedAt);
                });
                var skipNum = (pageNum - 1) * 5;
                var topics = data.slice(skipNum, skipNum + 5);
                res.send(200, topics);
            }
        }, function (error) {
            res.send(error);
        });
    } else { // 首个筛选筛选条件： 类别
        var getTopicsPromise = Topic.find({ Category: category });
        getTopicsPromise.then(function (data) {
            if (keyword !== '') {
                var newArr = [];
                data.forEach(function (topic) {
                    if (topic._doc.Title.indexOf(keyword) > 0) {
                        newArr.push(topic);
                    }
                });
                var skipNum = (pageNum - 1) * 5;
                var topics = newArr.slice(skipNum, skipNum + 5);
                res.send(200, topics);
            } else {
                data.sort(function (a, b) {
                    return Date.parse(b.CreatedAt) - Date.parse(a.CreatedAt);
                });
                var skipNum = (pageNum - 1) * 5;
                var topics = data.slice(skipNum, skipNum + 5);
                res.send(200, topics);
            }
        }, function (error) {
            res.send(error);
        });
    }
}

/*
 * 获取用户关注的帖子
 */
router.getUserFollowedTopics = function (req, res) {
    var user_id = req.params.user_id;
    User.find({ _id: user_id })
        .then(function (data) {
            var topicIDs = data[0].FollowedTopics;
            Topic.find({ _id: topicIDs })
                .then(function (data) {
                    res.send(200, data);
                }, function (error) {
                    res.send(error);
                });
        }, function (error) {
            res.send(error);
        });
}

/*
 * 找到对应用户发的所有帖子 
 */
router.getUserTopics = function (req, res) {
    var getUserTopicsPromise = Topic.find({ UserID: req.params.user_id });
    getUserTopicsPromise.then(function (data) {
        res.json(data);
    }, function (error) {
        res.send(error);
    });
}

/*
 * 用户发一个新帖子
 */
router.addNewTopic = function (req, res) {
    var input = req.body;
    var topic = new Topic();
    topic.UserID = req.params.user_id;
    topic.CreatedAt = new Date();
    topic.Content = input.Topic["Content"];
    topic.Title = input.Topic["Title"];
    topic.Category = input.Topic["Category"];
    topic.Author = input.Author;
    topic.Like = 0;
    topic.Dislike = 0;
    topic.View = 0;
    var addMewTopicPromise = topic.save();
    addMewTopicPromise.then(function (data) {
        res.json({ message: "Add new topic successfully" });
    }, function (error) {
        res.send(error);
    });
}

/*
 * 删除一个帖子
 */
router.deleteTopic = function (req, res) {
    var deleteTopicPromise = Topic.findByIdAndRemove(req.params.topic_id);
    deleteTopicPromise.then(function (data) {
        res.send(200, data);
    }, function (error) {
        res.send(error);
    });
}

module.exports = router;