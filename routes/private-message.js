var PrivateMessage = require('../models/private-message');
var User = require('../models/user');
var express = require('express');
var router = express.Router();

// 获取用户之间的对话
router.getUserMessageConversation = function (req, res) {
    var user_id = req.params.user_id;
    var target_user_id = req.params.target_user_id;
    var pageNum = req.body.PageNum;
    var getUserMessageConversationPromise = PrivateMessage.find({
        '$or':
            [{ UserID: user_id, TargetUserID: target_user_id },
            { UserID: target_user_id, TargetUserID: user_id }]
    });
    getUserMessageConversationPromise.then(function (data) {
        var skipNum = (pageNum - 1) * 5;
        var messages = data.slice(skipNum, skipNum + 5);
        res.send(200, messages);
    }, function (error) {
        res.send(error);
    });
}

// 将一用户全部未读标记为已读
router.markAllRead = function (req, res) {
    var user_id = req.params.user_id;
    var markUserPrivateMessagePromise = PrivateMessage.update({ TargetUserID: user_id }, { '$set': { 'Status': 1 } }, { multi: true });
    markUserPrivateMessagePromise.then(function (data) {
        res.send(200, data);
    }, function (error) {
        res.send(error);
    });
}

// 将两个用户之间的未读标记为已读
router.markReadBetweenTwoUsers = function (req, res) {
    var user_id = req.params.user_id;
    var target_user_id = req.params.target_user_id;
    var markReadBetweenTwoUsersPromise = PrivateMessage.update({
        '$or': [
            { UserID: user_id, TargetUserID: target_user_id },
            { UserID: target_user_id, TargetUserID: user_id }
        ]
    }, { '$set': { 'Status': '1' } }, { multi: true });
    markReadBetweenTwoUsersPromise.then(function (data) {
        User.find({ _id: user_id }).then(function (data) {
            var index = null;
            data[0].MostRecentConversation.forEach(function (message, i) {
                if (message.TargetID === user_id && message.SenderID === target_user_id) {
                    index = i;
                }
            });
            if (index !== null) {
                data[0].MostRecentConversation[index].Status = '1';
                User.update({ _id: user_id }, { '$set': { 'MostRecentConversation': data[0].MostRecentConversation } })
                    .then(function (data) {
                        res.send(200, data);
                    }, function (error) {
                        res.send(error);
                    })
            }
        }, function (error) {
            res.send(error);
        });
    }, function (error) {
        res.send(error);
    });
}

// 获取一用户的所有私信信息
router.getUserPrivateMessage = function (req, res) {
    var user_id = req.params.user_id;
    var findUserPrivateMessagePromise = PrivateMessage.find({ TargetUserID: user_id });
    findUserPrivateMessagePromise.then(function (data) {
        res.send(200, data);
    }, function (error) {
        res.send(error);
    });
}

// 用户单方面删除和另一个用户的所有私信
router.deleteAllMessageInConversation = function (req, res) {
    var user_id = req.params.user_id;
    var target_user_id = req.params.target_user_id;
    /******************* 更新对应所有私信的当前用户这一边的状态 ****************/
    PrivateMessage.find({
        '$or':
            [{ UserID: user_id, TargetUserID: target_user_id },
            { UserID: target_user_id, TargetUserID: user_id }]
    })
        .then(function (data) {
            for (var i = 0; i < data.length; i++) {
                var message = data[i];
                if (message.UserID === user_id && message.UserDelStatus === false) {
                    PrivateMessage.update({ _id: message._id }, { '$set': { 'UserDelStatus': true } })
                        .then(function (data) {
                            //
                        }, function (error) {
                            res.send(error);
                        });
                } else if (message.TargetUserID === user_id && message.TargetUserDelStatus === false) {
                    PrivateMessage.update({ _id: message._id }, { '$set': { 'TargetUserDelStatus': true } })
                        .then(function (data) {
                            //
                        }, function (error) {
                            res.send(error);
                        });
                }
            }
            /******************* 更新recent conversation ****************/
            User.find({ _id: user_id }).then(function (data) {
                var user = data[0];
                var index = null;
                for (var i = 0; i < user.MostRecentConversation.length; i++) {
                    var message = user.MostRecentConversation[i];
                    if (message.SenderID === user_id || message.TargetID === user_id) {
                        index = i;
                    }
                }
                if (index !== null) {
                    user.MostRecentConversation.splice(index, 1);
                    User.update({ _id: user_id }, { '$set': { 'MostRecentConversation': user.MostRecentConversation } })
                        .then(function (data) {
                            res.send(200, data);
                        }, function (error) {
                            res.send(error);
                        });
                } else {
                    res.send(200);
                }
            }, function (error) {
                res.send(error);
            });
        }, function (error) {
            res.send(error);
        });
}

// 删除私信
router.deleteMessage = function (req, res) {
    var user_id = req.params.user_id;
    var message_id = req.params.message_id;
    var target_user_id = "";
    var userRecentConverstaion = [];
    var findMessagePromise = PrivateMessage.find({ _id: message_id });
    findMessagePromise.then(function (data) { // 找到对应的消息
        // console.log(data[0], 111);
        var targetMessage = data[0];
        if (targetMessage.UserID === user_id) {
            // console.log(user_id, 222);
            targetMessage.UserDelStatus = true;
            target_user_id = targetMessage.TargetUserID;
        } else if (targetMessage.TargetUserID === user_id) {
            // console.log(user_id, 333);
            targetMessage.TargetUserDelStatus = true;
            target_user_id = targetMessage.UserID;
        }
        // console.log(message_id);
        PrivateMessage.update({ _id: message_id }, {
            '$set':
                { 'UserDelStatus': targetMessage.UserDelStatus, 'TargetUserDelStatus': targetMessage.TargetUserDelStatus }
        }).then(function (data) {
            // console.log(data, 444);
            var index = null;
            User.find({ _id: user_id }).then(function (data) {
                // console.log(data[0], 555);
                userRecentConverstaion = data[0].MostRecentConversation;
                data[0].MostRecentConversation.forEach(function (message, i) {
                    // console.log(message, i);
                    if (message.MessageID == message_id) {
                        index = i;
                    }
                });
                // console.log(index);
                if (index !== null) {
                    data[0].MostRecentConversation.splice(index, 1);
                    User.update({ _id: user_id }, { '$set': { 'MostRecentConversation': data[0].MostRecentConversation } })
                        .then(function (data) {
                            console.log(user_id, target_user_id, userRecentConverstaion);
                            PrivateMessage.find({
                                '$or':
                                    [{ UserID: user_id, TargetUserID: target_user_id },
                                    { UserID: target_user_id, TargetUserID: user_id }]
                            })
                                .then(function (data) {
                                    console.log(data, 666);
                                    if (data.length > 0) {
                                        var flag = false;
                                        for (var i = 0; i < data.length; i++) {
                                            var message = data[i];
                                            console.log(message.UserID === user_id, message.UserDelStatus === false);
                                            if (message.UserID === user_id && message.UserDelStatus === false) {
                                                flag = true;
                                                var newObj = {
                                                    SenderID: message.UserID,
                                                    TargetID: message.TargetUserID,
                                                    MessageID: message._id,
                                                    Content: message.Content,
                                                    SenderName: message.UserName,
                                                    ReceiverName: message.TargetUserName,
                                                    Status: '0',
                                                    CreatedAt: new Date()
                                                }
                                                console.log(newObj, 777);
                                                userRecentConverstaion.splice(index, 0, newObj);
                                                console.log(userRecentConverstaion);
                                                User.update({ _id: user_id }, { '$set': { 'MostRecentConversation': userRecentConverstaion } })
                                                    .then(function (data) {
                                                        res.send(200, data);
                                                    }, function (error) {
                                                        res.send(error);
                                                    });
                                                break;
                                            } else if (message.TargetUserID === user_id && message.TargetUserDelStatus === false) {
                                                flag = true;
                                                var newObj = {
                                                    SenderID: message.TargetUserID,
                                                    TargetID: message.UserID,
                                                    MessageID: message._id,
                                                    Content: message.Content,
                                                    SenderName: message.TargetUserName,
                                                    ReceiverName: message.UserName,
                                                    Status: '0',
                                                    CreatedAt: new Date()
                                                }
                                                userRecentConverstaion.splice(index, 0, newObj);
                                                console.log(userRecentConverstaion, 888);
                                                User.update({ _id: user_id }, { '$set': { 'MostRecentConversation': userRecentConverstaion } })
                                                    .then(function (data) {
                                                        res.send(200, data);
                                                    }, function (error) {
                                                        res.send(error);
                                                    });
                                                break;
                                            }
                                        }
                                        if (!flag) {
                                            console.log('flag', flag, 'nothing');
                                            res.send(200);
                                        }
                                    } else {
                                        res.send(200);
                                    }
                                }, function (error) {
                                    res.send(error);
                                });
                        }, function (error) {
                            res.send(error);
                        });
                } else {
                    res.send(200);
                }
            }, function (error) {
                res.send(error);
            });
        }, function (error) {
            res.send(error);
        });
    }, function (error) {
        res.send(error);
    });
}

// 发送私信
router.sendPrivateMessage = function (req, res) {
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
    savePrivateMessagePromise.then(function (data) {
        var message_id = data._id;
        // 将最新的消息存入两个用户的recent conversation数组中
        var findUserPromise = User.find({ _id: user_id });
        findUserPromise.then(function (data) {
            var index = null;
            data[0].MostRecentConversation.forEach(function (item, i) {
                if (
                    (item.TargetID === target_user_id && item.SenderID === user_id) ||
                    (item.TargetID === user_id && item.SenderID === target_user_id)
                ) {
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
                Status: '0',
                CreatedAt: new Date()
            };
            if (index !== null) {
                data[0].MostRecentConversation.splice(index, 1);
            }
            data[0].MostRecentConversation.unshift(newObj);
            User.update({ _id: user_id }, { '$set': { 'MostRecentConversation': data[0].MostRecentConversation } })
                .then(function (data) {
                    res.send(200, data);
                }, function (error) {
                    res.send(error);
                });
            // 更新另一个用户的信息
            var findAnotherUserPromise = User.find({ _id: target_user_id });
            findAnotherUserPromise.then(function (data) {
                var index = null;
                data[0].MostRecentConversation.forEach(function (item, i) {
                    if ((item.TargetID === target_user_id && item.SenderID === user_id) ||
                        (item.TargetID === user_id && item.SenderID === target_user_id)) {
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
                    Status: '0',
                    CreatedAt: new Date()
                };
                if (index !== null) {
                    data[0].MostRecentConversation.splice(index, 1);
                }
                data[0].MostRecentConversation.unshift(newObj);
                User.update({ _id: target_user_id }, { '$set': { 'MostRecentConversation': data[0].MostRecentConversation } })
                    .then(function (data) {
                        res.send(200, data);
                    }, function (error) {
                        res.send(error);
                    });
            }, function (error) {
                res.send(error);
            });
        }, function (error) {
            res.send(error);
        });
    }, function (error) {
        res.send(error);
    });
}

module.exports = router;