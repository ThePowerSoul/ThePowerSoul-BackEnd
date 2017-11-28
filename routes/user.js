var User = require('../models/user');
var express = require('express');
var router = express.Router();

router.addTopicToFav = function(req, res) {
    var user_id = req.params.user_id;
    var topic_id = req.params.topic_id;
    var findUserPromise = User.find({_id: user_id});
    findUserPromise.then(function(data) {
        if (data.length > 0) {
            var user = data[0];
            if (user.FavTopics.indexOf(topic_id) >= 0) {
                res.send(400, "Added");
            } else {
                var addToUserTopicFavPromise = User.update({id: user_id}, {$push: {"FavTopics": topic_id}});
                addToUserTopicFavPromise.then(function(data) {
                    res.send(200, data);
                }, function(error) {
                    res.send(error);
                });
            }
        } else {
            res.send(404, "UserNotFound");
        }
    }, function(error) {
        res.send(error);
    });
}

router.addArticleToFav = function(req, res) {
    var user_id = req.params.user_id;
    var topic_id = req.params.topic_id;
    var findUserPromise = User.find({_id: user_id});
    findUserPromise.then(function(data) {
        if (data.length > 0) {
            var user = data[0];
            if (user.FavTopics.indexOf(topic_id) >= 0) {
                res.send(400, "Added");
            } else {
                var addToUserArticleFavPromise = User.update({id: user_id}, {$push: {"FavArticles": topic_id}});
                addToUserArticleFavPromise.then(function(data) {
                    res.send(200, data);
                }, function(error) {
                    res.send(error);
                });
            }
        } else {
            res.send(404, "UserNotFound");
        }
    }, function(error) {
        res.send(error);
    });
}

/*
    获得目标用户信息
    判断是否在当前用户关注列表中
*/
router.getFollowingStatus = function(req, res) {
    var user_id = req.params.user_id;
    var target_id = req.params.target_id;
    getFollowingStatusPromise = User.find({"$or": [{"_id": user_id}, {"_id": target_id}]});
    getFollowingStatusPromise.then(function(data) {
        var user = data[0];
        var targetUser = data[1];
        var obj = {};
        obj.Data = data[1];
        if (user.FollowingUsers.indexOf(targetUser._id) >= 0) {
            obj.IsFollowing = true;
        } else {
            obj.IsFollowing = false;
        }
        res.send(obj);
    }, function(error) {
        res.send(error);
    }); 
}

/*
    搜索用户
*/
router.getUsers = function(req, res) {
    var emailKeyword = req.body.EmailKeyword;
    var getUsersPromise = User.find();
    var arr = [];
    getUsersPromise.then(function(data) {
        for (var index = 0; index < data.length; index++) {
            if (data[index].Email.indexOf(emailKeyword) >= 0) {
                arr.push(data[index]);
            }
        }
        res.send(200, arr);
    }, function(error) {
        res.send(error);
    });
}

/*
    添加用户到自己的关注列表
*/
router.addToFollowing = function(req, res) {
    var user_id = req.params.user_id;
    var target_id = req.params.target_id;
    var getUserPromise = User.update({_id: user_id}, {$push: {"FollowingUsers": target_id}});
    getUserPromise.then(function(data) {
        res.send(200, '关注成功');
    }, function(error) {
        res.send(error);
    });
}

/*
    将用户从自己的关注中移除
*/
router.removeFromFollowing = function(req, res) {
    var user_id = req.params.user_id;
    var target_id = req.params.target_id;
    var getUserPromise = User.update({_id: user_id}, {$pull: {"FollowingUsers": target_id}});
    getUserPromise.then(function(data) {
        res.send(200, '取消关注成功');
    }, function(error) {
        res.send(error);
    });
}


/*
    注册
*/
router.signUp = function(req, res){
    // 检查用户名是否存在
    var checkUserExistPromise = User.find({Email: req.body.Email});
    checkUserExistPromise.then(function(data) {
        if (data.length > 0) {
            res.send(400, '邮箱已存在');
        } else {
            // 检查显示名是否被占用
            var checkDisplayNamePromise = User.find({DisplayName: req.body.DisplayName});
            checkDisplayNamePromise.then(function(data) {
                if(data.length > 0) {
                    res.send(400, '显示名已被占用');
                } else {
                    // 创建新用户
                    var newUser = new User();
                    newUser.Name = req.body.Name;
                    newUser.DisplayName = req.body.DisplayName;
                    newUser.HashedPassword = req.body.Password;
                    newUser.Email = req.body.Email;
                    newUser.CreatedAt = new Date();
                    newUser.AvatarID = "";
                    newUser.WechatID = "";
                    newUser.Point = 0;
                    newUser.IsVerified = false;
                    newUser.VerifiedCategory = "";
                    newUser.IsAdmin = false;
                    newUser.PhoneNumber = "";
                    newUser.VerifiedPhoneNumber = "";
                    newUser.FollowingUsers = [];
                    var addNewUserPromise = newUser.save();
                    addNewUserPromise.then(function(data) { // 注册成功
                        res.send(200, {
                            Name: newUser.Name,
                            DisplayName: newUser.DisplayName,
                            Email: newUser.Email,
                            Point: newUser.Point,
                            _id: data._id
                        });
                    }, function(error) {
                        res.send(error);
                    });
                }
            }, function(error) {
                res.send(error);
            });
        }
    }, function(error) {
        res.send(error);
    });
}


/*
    登录
*/
router.login = function(req,res){
    var input = req.body;
    var email = input.Email;
    var password = input.Password;
    // 检查用户名是否合法
    console.log(req.body);
    var getUserInstancePromise = User.find({Email: email});
    getUserInstancePromise.then(function(data) {
        if (data.length > 0) {
            // 检查密码是否正确
            if (data[0].HashedPassword === password) {
                res.send(200, {
                    Name: data[0].Name,
                    DisplayName: data[0].DisplayName,
                    Email: data[0].Email,
                    Point: data[0].Point,
                    _id: data[0]._id
                });
            } else {
                res.send(400, '密码错误，请重新输入');
            }
        } else { // 用户名不存在
            res.send(400, '该用户不存在');
        }
    }, function(error) {
        res.send(error);
    });
}

module.exports = router;