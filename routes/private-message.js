var PrivateMessage = require('../models/private-message');
var express = require('express');
var User = require('../models/user');
var router = express.Router();

// 获取用户的消息列表
router.getUserMessageList = function(req, res) {
    var user_id = req.params.user_id;  
    var getUserMessageListPromise = PrivateMessage.aggregate([
        {
            '$match': {   
                $or: [
                    {
                        UserID: user_id, TargetUserID: target_user_id
                    },
                    {
                        TargetUserID: user_id, UserID: user_id
                    }    
                ]
            }
        }
    ]);
    getUserMessageListPromise.then(function(data) {
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });     
}

// 获取用户之间的对话
router.getUserMessageConversation = function(req, res) {
    var user_id = req.params.user_id;
    var target_user_id = req.params.target_user_id;
    var getUserMessageConversationPromise = PrivateMessage.find({'$or': [{UserID: user_id, TargetUserID: target_user_id},
        {UserID: target_user_id, TargetUserID: user_id}]});
    getUserMessageConversationPromise.then(function(data) {
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
}

// 将某条信息标识为已读
router.markSingleMessage = function(req, res) {
    var user_id = req.params.user_id;
    var markUserSingleMessagePromise = PrivateMessage.update({TargetUserID: user_id}, {'$set': {'Read': true}});
    markUserSingleMessagePromise.then(function(data) {
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
};

// 将一用户全部未读标记为已读
router.markAllRead = function(req, res) {
    var user_id = req.params.user_id;
    var markUserPrivateMessagePromise = PrivateMessage.update({TargetUserID: user_id}, {'$set': {'Read': true}});
    markUserPrivateMessagePromise.then(function(data) {
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
}

// 获取一用户的所有私信信息
router.getUserPrivateMessage = function(req, res) {
    var user_id = req.params.user_id;
    var findUserPrivateMessagePromise = PrivateMessage.find({TargetUserID: user_id});
    findUserPrivateMessagePromise.then(function(data) {
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
}

// 删除私信
router.deleteMessage = function(req, res) {
    var user_id = req.params.user_id;
    var deleteMessagePromise = PrivateMessage.findOneByIdAndRemove({UserID: user_id});
    deleteMessagePromise.then(function(data) {
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
}

// 发送私信
router.sendPrivateMessage = function(req, res){
    var user_id = req.params.user_id;
    var target_user_id = req.params.target_user_id;
    var input = req.body;
    var privateMessage = new PrivateMessage();
    privateMessage.TargetUserID = target_user_id;
    privateMessage.UserID = user_id;
    privateMessage.Content = input.Content;
    privateMessage.UserName = input.UserName;
    privateMessage.TargetUserName = input.TargetUserName;
    privateMessage.CreatedAt = new Date();
    privateMessage.Status = "0";
    privateMessage.UserDelStatus = false;
    privateMessage.TargetUserDelStatus = false;
    var savePrivateMessagePromise = privateMessage.save();
    savePrivateMessagePromise.then(function(data) {
        var message_id = data._id;
        // 将最新的消息存入两个用户的recent conversation数组中
        var findUserPromise = User.find({_id: user_id});
        findUserPromise.then(function(data) {
            var index = null;
            data[0].MostRecentConversation.forEach(function(item, i) {
                if (item.TargetID === target_user_id && item.SenderID === user_id) {
                    index = i;
                }
            });
            var newObj = {
                SenderID: user_id,
                TargetID: target_user_id,
                MessageID: message_id,
                Content: req.body.Content,
                SenderName: req.body.UserName,
                ReceiverName: req.body.TargetUserName,
                Status: "0"
            };
            console.log(index, 111);
            if (index !== null) {
                data[0].MostRecentConversation.splice(index, 1);
            }
            data[0].MostRecentConversation.unshift(newObj);
            console.log(data[0].MostRecentConversation,111);
            User.update({_id: user_id}, {'$set': {'MostRecentConversation': data[0].MostRecentConversation}})
                .then(function(data) {
                    res.send(200, data);
                }, function(error) {
                    res.send(error);
                });
            // 更新另一个用户的信息
            var findAnotherUserPromise = User.find({_id: target_user_id});
            findAnotherUserPromise.then(function(data) {
                var index = null;
                data[0].MostRecentConversation.forEach(function(item, i) {
                    if (item.TargetID === target_user_id && item.SenderID === user_id) {
                        index = i;
                    }
                });
                var newObj = {
                    SenderID: user_id,
                    TargetID: target_user_id,
                    MessageID: message_id,
                    Content: req.body.Content,
                    SenderName: req.body.UserName,
                    ReceiverName: req.body.TargetUserName,
                    Status: "0"
                };
                console.log(index, 222);
                if (index !== null) {
                    data[0].MostRecentConversation.splice(index, 1);
                }
                data[0].MostRecentConversation.unshift(newObj);
                console.log(data[0].MostRecentConversation,222);
                User.update({_id: target_user_id}, {'$set': {'MostRecentConversation': data[0].MostRecentConversation}})
                    .then(function(data){
                        res.send(200, data);
                    }, function(error) {
                        res.send(error);
                    });
            }, function(error) {    
                res.send(error);
            });
        }, function(error) {
            res.send(error);
        });
    }, function(error) {
        res.send(error);
    }); 
}

module.exports = router;