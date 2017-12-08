var User = require('../models/user');
var Topic = require('../models/topic');
var Article = require('../models/article');
var express = require('express');
var crypto = require('crypto');
var router = express.Router();

// 获取用户发的帖子数量和文章数量
router.getUserTopicAndArticleNumber = function(req, res) {
    var user_id = req.params.user_id;
    var result = {
        TopicNumber: 0,
        ArticleNumber: 0
    }
    Topic.find({UserID: user_id})
        .then(function(data) {
            result.TopicNumber = data.length;
            Article.find({UserID: user_id})
                .then(function(data) {
                    result.ArticleNumber = data.length;
                    res.send(200, result);
                }, function(error) {
                    res.send(error);
                }); 
        }, function(error) {
            res.send(error);
        });
}

// 获取关注用户发的帖子，文章，关注的人的的帖子
router.getFollowingTopicsAndArticles = function(req, res) {
    var user_id = req.params.user_id;
    User.find({_id: user_id}).then(function(data) {
        var topisAndArticles = [];
        var followingUsers = data[0].FollowingUsers;
        followingUsers.forEach(function(user_idm, index) {
            targetUser = User.find({_id: user_id}).then(function(data) {
                Topic.find({'$or': [{UserID: user_id}, {_id: {'$in': data[0].FollowedTopics}}]}).then(function(data) {
                    topisAndArticles.push(data);
                    Article.find({UserID: user_id}).then(function(data) {
                        topisAndArticles.push(data);
                        if (index === followingUsers.length) {
                            res.send(200, topisAndArticles);
                        }
                    }, function(error) {
                        res.send(error);
                    });
                }, function(error) {    
                    res.send(error);
                });
            }, function(error) {
                res.send(error);
            });
        });
    }, function(error) {
        res.send(error);
    });
}

/********************** 初始化加载
 * 								我关注的话题
 * 								我关注的人关注的帖子信息
 * 								我关注的人发表的帖子
 *           
 * 								去重
 * 	 ********************/
router.getFollowingTopicsAndFollowingUsersFollowingTopics = function(req, res) {
    var user_id = req.params.user_id;
    var topics = [];
    User.find({_id: user_id})
        .then(function(data) {
            var user = data[0];
            var usersFollowingUsers = user.FollowingUsers; // 当前用户正在关注的用户们
            Topic.find({_id: {'$in': user.FollowedTopics}}) // 当前用户正在关注的帖子
                .then(function(data) {
                    topics = topics.concat(data);
                    Topic.find({UserID: {'$in': usersFollowingUsers}}) // 当前用户正在关注的用户们发的帖子
                    .then(function(data) {
                        topics = topics.concat(data);
                    }, function(error) {    
                        res.send(error);
                    });
                    for (var i = 0; i < usersFollowingUsers.length; i++) {
                        User.find({_id: usersFollowingUsers[i]})
                            .then(function(data) {
                                Topic.find({_id: {'$in': data[0].FollowedTopics}}) // 当前用户关注的用户们正在关注的帖子
                                    .then(function(data) {
                                        topics = topics.concat(data);
                                    }, function(error) {
                                        res.send(error);
                                    });
                            }, function(error) {
                                res.send(error);
                            });
                    }
                    topics = removeSameElementInArr(topics); // 去重
                    res.send(200, topics);
                }, function(error) {
                    res.send(error);
                });
        }, function(error) {
            res.send(error);
        });
}

/*  
    获取我关注的用户们发的文章
*/
router.getFollowingUsersArticles = function(req, res) {
    var user_id = req.params.user_id;
    var articles = [];
    User.find({_id: user_id})
        .then(function(data) {
            var users = User.find({_id: {'$in': data[0].FollowingUsers}})
                .then(function(data) {
                    for(var i = 0; i < data.length; i++) {
                        Article.find({UserID: data[i]._id})
                            .then(function(data) {
                                articles = articles.concat(data);
                            }, function(error) {
                                res.send(error);
                            });
                    }
                    res.send(200, data);
                }, function(error) {
                    res.send(error);
                });
        }, function(error) {
            res.send(error);
        });
}

function removeSameElementInArr(arr) {
    var res = [];
    var json = {};
    for(var i = 0; i < arr.length; i++){
        if(!json[arr[i]]){
            res.push(arr[i]);
            json[arr[i]] = 1;
        }
    }
    return res;
}

/*  
    获取用户信息
*/
router.getUserDetail = function(req, res) {
    var user_id = req.params.user_id;
    User.find({_id: user_id}).then(function(data) {
        res.send(200, data[0]);
    }, function(error) {
        res.send(error);
    });
}

/*  
    获得喜欢的帖子
*/
router.getFavTopics = function(req, res) {
    var user_id = req.params.user_id;
    var findUserPromise = User.find({_id: user_id});
    findUserPromise.then(function(data) {
        var user = data[0];
        var findFavTopics = Topic.find({_id: {'$in': user.FavTopics}});
        findFavTopics.then(function(data) {
            res.send(200, data);
        }, function(error) {    
            res.send(error);
        });
    }, function(error) {
        res.send(error);
    });
}

/*  
    获得喜欢的文章
*/
router.getFavArticles = function(req, res) {
    var user_id = req.params.user_id;
    var findUserPromise = User.find({_id: user_id});
    findUserPromise.then(function(data) {
        var user = data[0];
        var findFavArticles = Article.find({_id: {'$in': user.FavArticles}});
        findFavArticles.then(function(data) {
            res.send(200, data);
        }, function(error) {    
            res.send(error);
        });
    }, function(error) {
        res.send(error);
    });
}

/*  
    将帖子添加到喜欢
*/
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
                var addToUserTopicFavPromise = User.update({_id: user_id}, {$push: {"FavTopics": topic_id}});
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

/*  
    将文章添加到喜欢
*/
router.addArticleToFav = function(req, res) {
    var user_id = req.params.user_id;
    var article_id = req.params.article_id;
    var findUserPromise = User.find({_id: user_id});
    findUserPromise.then(function(data) {
        if (data.length > 0) {
            var user = data[0];
            if (user.FavArticles.indexOf(article_id) >= 0) {
                res.send(400, "Added");
            } else {
                var addToUserArticleFavPromise = User.update({_id: user_id}, {$push: {"FavArticles": article_id}});
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
    getUserObjPromise = User.find({_id: user_id});
    getUserObjPromise.then(function(user) {
        var getTargetUserObjPromist = User.find({_id: target_id});
        getTargetUserObjPromist.then(function(targetUser) {
            var obj = {};
            obj.Data = targetUser[0];
            if (user[0].FollowingUsers.indexOf(targetUser[0]._id) >= 0) {
                obj.IsFollowing = true;
            } else {
                obj.IsFollowing = false;
            }
            res.send(200, obj);
        }, function(error) {    
            res.send(error);
        });
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
                    var saltResult = "";
                    var hashResult = "";
                    var password = req.body.Password;
                    newUser.Name = req.body.Name;
                    newUser.DisplayName = req.body.DisplayName;
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
                    newUser.MostRecentConversation = [];
                    newUser.FavTopics = [];
                    newUser.FavArticles = [];
                    crypto.randomBytes(128, function(error, salt) {
                        if (error) {
                            throw error;
                        }
                        saltResult = salt.toString('hex'); // 得到salt
                        newUser.Salt = saltResult;
                        crypto.pbkdf2(password, saltResult, 4096, 256, 'sha512', function (error,hash) {
                            if (error) { throw error; }
                            hashResult = hash.toString('hex'); //生成密文
                            newUser.HashedPassword = hashResult;
                            // save new user
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
                        });
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
    var getUserInstancePromise = User.find({Email: email});
    getUserInstancePromise.then(function(data) {
        if (data.length > 0) {
            // 检查密码是否正确
            crypto.pbkdf2(password, data[0].Salt, 4096, 256, 'sha512', function (error, hash) {
                if (error) { throw error; }
                if (hash.toString('hex') === data[0].HashedPassword) {
                    // req.session[data[0]._id] = data[0];
                    // res.cookie('tps', data[0]._id, 
                    //     {
                    //         expires: new Date(Date.now() + 600000), 
                    //         httpOnly: false,
                    //         domain: false
                    //     }
                    // );
                    // res.send(200);
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
            });
        } else { // 用户名不存在
            res.send(400, '该用户不存在');
        }
    }, function(error) {
        res.send(error);
    });
}

module.exports = router;