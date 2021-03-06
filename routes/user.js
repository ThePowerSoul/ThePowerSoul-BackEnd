var User = require('../models/user');
var Topic = require('../models/topic');
var Article = require('../models/article');
var express = require('express');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var jsonwebtoken = require('jsonwebtoken');
var oss = require('ali-oss');
var co = require('co');
var router = express.Router();
var salt = "thepowersoul";
// 开启redis
var redis = require('redis'),
    RDS_PORT = 6379,        //端口号
    RDS_HOST = '127.0.0.1',    //服务器IP
    RDS_OPTS = {},            //设置项
    client = redis.createClient(RDS_PORT, RDS_HOST, RDS_OPTS);

client.on('ready', function (res) {
    console.log('ready');
});

router.getSiteData = function (req, res) {
    var body = {
        RegisteredUserNumber: 0,
        ActiveUserNumber: 0,
        TopicCount: 0,
        ArticleCount: 0
    }
    var getUserNumberPromise = User.find().lean();
    var getTopicNumberPromise = Topic.find();
    var getArticleNumberPromise = Article.find();
    var currentDate = new Date();
    getUserNumberPromise.then(function (data) {
        body.RegisteredUserNumber = data.length;
        var activeUserArr = [];
        data.forEach(function (item) {
            var timeGap = (currentDate - item.LastLoginDate) / 1000 / 60 / 60;
            if (timeGap < 24) {
                activeUserArr.push(item);
            }
        });
        body.ActiveUserNumber = activeUserArr.length;
        getTopicNumberPromise.then(function (data) {
            body.TopicCount = data.length;
            getArticleNumberPromise.then(function (data) {
                body.ArticleCount = data.length;
                res.send(200, body);
            }, function (err) {
                res.send(err);
            });
        }, function (err) {
            res.send(err);
        });
    }, function (err) {
        res.send(err);
    });
}

function createCode() {
    var code = "";
    var codeLength = 4;
    var selectChar = new Array(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z');
    for (var i = 0; i < codeLength; i++) {
        var charIndex = Math.floor(Math.random() * 36);
        code += selectChar[charIndex];
    }
    return code;
}

var config = {
    host: 'smtp.126.com',
    secureConnection: true,
    port: 465,
    auth: {
        user: 'wps_zy@126.com',
        pass: 'thepowersoul2017'
    }
}

var mail = {
    from: 'ThePoserSoul <wps_zy@126.com>',
    subject: 'ThePowerSoul注册验证码',
    to: '',
    text: ''
}

var transporter = nodemailer.createTransport(config);

// 获得上传签名
var Base64 = require('../lib/base64.js');
var Crypto = require('../lib/crypto.js');
var host = 'thepowersoul2018.oss-cn-qingdao-internal.aliyuncs.com';
var accessid = 'LTAILjmmB1fnhHlx';
var accesskey = '2WWvSKQVLOLCto3UsdNVGdqfPOS2AG';
var message;

var policyText = {
    "expiration": "2020-01-01T12:00:00.000Z", //设置该Policy的失效时间，超过这个失效时间之后，就没有办法通过这个policy上传文件了
    "conditions": [
        ["content-length-range", 0, 1048576000] // 设置上传文件的大小限制
    ]
};

var policyBase64 = Base64.encode(JSON.stringify(policyText));
message = policyBase64;
var bytes = Crypto.HMAC(Crypto.SHA1, message, accesskey, { asBytes: true });
var signature = Crypto.bytesToBase64(bytes);

// 定义下载oss文件client
var ossClient = new oss.Wrapper({
    accessKeyId: accessid,
    accessKeySecret: accesskey,
    bucket: 'thepowersoul2018',
    region: 'oss-cn-qingdao'
});

router.getUploadPolicy = function (req, res) {
    var obj = {
        Signature: signature,
        PolicyText: policyBase64
    }
    res.send(200, obj);
}

router.setPicturePublic = function (req, res) {
    var key = req.body.Key;
    co(function* () {
        yield ossClient.putACL(key, 'public-read');
        var obj = yield ossClient.get(key);
        res.send(200, { Src: obj.res.requestUrls[0] });
        var result = yield ossClient.getACL(key);
    }).catch(function (err) {
        res.send(err);
    });
}

router.updateProfilePicture = function (req, res) {
    var url = req.body.Src; // 获取用户头像的url
    var user_id = req.params.user_id;
    User.update({ _id: user_id }, { $set: { 'AvatarID': url } })
        .then(function (data) {
            res.send(200);
        }, function (error) {
            res.send(500, error);
        });
}

router.permissionService = function (req, res) {
    var token = req.get('Authorization');
    client.get(token, function (err, response) {
        if (err) {
            res.send(500);
        } else if (response === null) {
            res.send(400, '用户登陆已经过期, 请重新登录');
        } else {
            res.send(200, { Permission: 'good' });
        }
    });
}

router.removeSession = function (req, res) {
    var token = req.get('Authorization');
    client.get(token, function (err, response) {
        if (err) {
            res.send(500, '清除用户信息失败');
        } else if (response === null) {
            res.send(200);
        } else {
            // 删除session
            client.del(token, function (err, response) {
                if (err) {
                    res.send(500, '清除用户信息失败');
                } else {
                    res.send(200);
                }
            });
        }
    });
}

// 获取用户发的帖子数量和文章数量
router.getUserTopicAndArticleNumber = function (req, res) {
    var user_id = req.params.user_id;
    var result = {
        TopicNumber: 0,
        ArticleNumber: 0
    }
    Topic.find({ UserID: user_id })
        .then(function (data) {
            result.TopicNumber = data.length;
            Article.find({ UserID: user_id })
                .then(function (data) {
                    result.ArticleNumber = data.length;
                    res.send(200, result);
                }, function (error) {
                    res.send(error);
                });
        }, function (error) {
            res.send(error);
        });
}

/*
 * 获取用户关注的用户发的帖子或者文章
 */
router.getUserFollowedUsersContent = function (req, res) {
    var user_id = req.params.user_id;
    var pageNum = req.body.Page;
    var findUserPromise = User.find({ _id: user_id }).lean();
    var result = [];
    findUserPromise.then(function (data) {
        var usersArr = data[0].FollowingUsers;
        if (usersArr.length > 0) {
            for (var i = 0; i < usersArr.length; i++) {
                var id = usersArr[i];
                var findUserTopics = Topic.find({ UserID: id });
                findUserTopics.then(function (topics) {
                    result = result.concat(topics);
                    var findUserArticle = Article.find({ UserID: id });
                    findUserArticle.then(function (articles) {
                        result = result.concat(articles);
                        // 对结果按照时间排序
                        if (result.length > 0) {
                            result.sort(function (a, b) {
                                return Date.parse(b.CreatedAt) - Date.parse(a.CreatedAt);
                            });
                            var skipNum = (pageNum - 1) * 5;
                            result = result.slice(skipNum, skipNum + 5);
                        }
                        res.send(200, result);
                    }, function (error) {
                        res.send(error);
                    });
                }, function (error) {
                    res.send(error);
                });
            }
        } else {
            res.send(200, []);
        }
    }, function (error) {
        res.send(error);
    });
}

// /********************** 初始化加载
//  * 								我关注的话题
//  * 								我关注的人关注的帖子信息
//  * 								我关注的人发表的帖子
//  *           
//  * 								去重
//  * 	 ********************/
// router.getFollowingTopicsAndFollowingUsersFollowingTopics = function (req, res) {
//     var user_id = req.params.user_id;
//     var topics = [];
//     User.find({ _id: user_id })
//         .then(function (data) {
//             var user = data[0];
//             var usersFollowingUsers = user.FollowingUsers; // 当前用户正在关注的用户们
//             Topic.find({ _id: { '$in': user.FollowedTopics } }) // 当前用户正在关注的帖子
//                 .then(function (data) {
//                     topics = topics.concat(data);
//                     Topic.find({ UserID: { '$in': usersFollowingUsers } }) // 当前用户正在关注的用户们发的帖子
//                         .then(function (data) {
//                             topics = topics.concat(data);
//                         }, function (error) {
//                             res.send(error);
//                         });
//                     for (var i = 0; i < usersFollowingUsers.length; i++) {
//                         User.find({ _id: usersFollowingUsers[i] })
//                             .then(function (data) {
//                                 Topic.find({ _id: { '$in': data[0].FollowedTopics } }) // 当前用户关注的用户们正在关注的帖子
//                                     .then(function (data) {
//                                         topics = topics.concat(data);
//                                     }, function (error) {
//                                         res.send(error);
//                                     });
//                             }, function (error) {
//                                 res.send(error);
//                             });
//                     }
//                     topics = removeSameElementInArr(topics); // 去重
//                     res.send(200, topics);
//                 }, function (error) {
//                     res.send(error);
//                 });
//         }, function (error) {
//             res.send(error);
//         });
// }

/*  
    获取我关注的用户们发的文章
*/
router.getFollowingUsersArticles = function (req, res) {
    var user_id = req.params.user_id;
    var articles = [];
    User.find({ _id: user_id })
        .then(function (data) {
            var users = User.find({ _id: { '$in': data[0].FollowingUsers } })
                .then(function (data) {
                    for (var i = 0; i < data.length; i++) {
                        Article.find({ UserID: data[i]._id })
                            .then(function (data) {
                                articles = articles.concat(data);
                            }, function (error) {
                                res.send(error);
                            });
                    }
                    res.send(200, data);
                }, function (error) {
                    res.send(error);
                });
        }, function (error) {
            res.send(error);
        });
}

function removeSameElementInArr(arr) {
    var res = [];
    var json = {};
    for (var i = 0; i < arr.length; i++) {
        if (!json[arr[i]]) {
            res.push(arr[i]);
            json[arr[i]] = 1;
        }
    }
    return res;
}

/*  
    获取用户信息
*/
router.getUserDetail = function (req, res) {
    var user_id = req.params.user_id;
    User.find({ _id: user_id }).then(function (data) {
        res.send(200, data[0]);
    }, function (error) {
        res.send(error);
    });
}

/*  
    获得喜欢的帖子
*/
router.getFavTopics = function (req, res) {
    var user_id = req.params.user_id;
    var findUserPromise = User.find({ _id: user_id });
    findUserPromise.then(function (data) {
        var user = data[0];
        var findFavTopics = Topic.find({ _id: { '$in': user.FavTopics } });
        findFavTopics.then(function (data) {
            res.send(200, data);
        }, function (error) {
            res.send(error);
        });
    }, function (error) {
        res.send(error);
    });
}

/*  
    获得喜欢的文章
*/
router.getFavArticles = function (req, res) {
    var user_id = req.params.user_id;
    var findUserPromise = User.find({ _id: user_id });
    findUserPromise.then(function (data) {
        var user = data[0];
        var findFavArticles = Article.find({ _id: { '$in': user.FavArticles } });
        findFavArticles.then(function (data) {
            res.send(200, data);
        }, function (error) {
            res.send(error);
        });
    }, function (error) {
        res.send(error);
    });
}

/*  
    将帖子添加到喜欢
*/
router.addTopicToFav = function (req, res) {
    var user_id = req.params.user_id;
    var topic_id = req.params.topic_id;
    var findUserPromise = User.find({ _id: user_id });
    findUserPromise.then(function (data) {
        if (data.length > 0) {
            var user = data[0];
            if (user.FavTopics.indexOf(topic_id) >= 0) {
                res.send(400, "Added");
            } else {
                var addToUserTopicFavPromise = User.update({ _id: user_id }, { $push: { "FavTopics": topic_id } });
                addToUserTopicFavPromise.then(function (data) {
                    res.send(200, data);
                }, function (error) {
                    res.send(error);
                });
            }
        } else {
            res.send(404, "UserNotFound");
        }
    }, function (error) {
        res.send(error);
    });
}

/*  
    将文章添加到喜欢
*/
router.addArticleToFav = function (req, res) {
    var user_id = req.params.user_id;
    var article_id = req.params.article_id;
    var findUserPromise = User.find({ _id: user_id });
    findUserPromise.then(function (data) {
        if (data.length > 0) {
            var user = data[0];
            if (user.FavArticles.indexOf(article_id) >= 0) {
                res.send(400, "Added");
            } else {
                var addToUserArticleFavPromise = User.update({ _id: user_id }, { $push: { "FavArticles": article_id } });
                addToUserArticleFavPromise.then(function (data) {
                    res.send(200, data);
                }, function (error) {
                    res.send(error);
                });
            }
        } else {
            res.send(404, "UserNotFound");
        }
    }, function (error) {
        res.send(error);
    });
}

/*
    获得目标用户信息
    判断是否在当前用户关注列表中
*/
router.getFollowingStatus = function (req, res) {
    var user_id = req.params.user_id;
    var target_id = req.params.target_id;
    getUserObjPromise = User.find({ _id: user_id });
    getUserObjPromise.then(function (user) {
        var getTargetUserObjPromist = User.find({ _id: target_id });
        getTargetUserObjPromist.then(function (targetUser) {
            var obj = {};
            obj.Data = targetUser[0];
            if (user[0].FollowingUsers.indexOf(targetUser[0]._id) >= 0) {
                obj.IsFollowing = true;
            } else {
                obj.IsFollowing = false;
            }
            res.send(200, obj);
        }, function (error) {
            res.send(error);
        });
    }, function (error) {
        res.send(error);
    });
}

/*
    搜索用户
*/
router.getUsers = function (req, res) {
    var emailKeyword = req.body.EmailKeyword;
    var getUsersPromise = User.find();
    var arr = [];
    getUsersPromise.then(function (data) {
        for (var index = 0; index < data.length; index++) {
            if (data[index].Email.indexOf(emailKeyword) >= 0) {
                arr.push(data[index]);
            }
        }
        res.send(200, arr);
    }, function (error) {
        res.send(error);
    });
}

/*
    添加用户到自己的关注列表
*/
router.addToFollowing = function (req, res) {
    var user_id = req.params.user_id;
    var target_id = req.params.target_id;
    var getUserPromise = User.update({ _id: user_id }, { $push: { "FollowingUsers": target_id } });
    getUserPromise.then(function (data) {
        res.send(200, '关注成功');
    }, function (error) {
        res.send(error);
    });
}

/*
    将用户从自己的关注中移除
*/
router.removeFromFollowing = function (req, res) {
    var user_id = req.params.user_id;
    var target_id = req.params.target_id;
    var getUserPromise = User.update({ _id: user_id }, { $pull: { "FollowingUsers": target_id } });
    getUserPromise.then(function (data) {
        res.send(200, '取消关注成功');
    }, function (error) {
        res.send(error);
    });
}

/**
 *  发送注册账号的邮件
 */
router.sendVerifyEmail = function (req, res) {
    var code = createCode();
    mail.to = req.body.Email;
    mail.text = "看不到文字的都是麻瓜, 请记住你的验证码是：" + code + ", 有效期5分钟。";
    transporter.sendMail(mail, function (error, info) {
        if (error) {
            console.log("first spot");
            res.send(500, error);
        } else {
            // 检查当前email是否有验证码
            client.get(req.body.Email, function (error, response) {
                if (error) {
                    console.log("second spot");
                    res.send(500, error);
                } else {
                    if (response === null) {
                        // mail被正常发送
                        // 将验证码和key存入redis，设置一个过期时间
                        client.set(req.body.Email, code);
                        client.expire(req.body.Email, 300);
                        res.send(200, {
                            Key: req.body.Email,
                            Code: code
                        });
                    } else {
                        res.send(400, { Message: '请勿短时间内重复索取验证码', Code: response });
                    }
                }
            });
        }
    });
}

/*
    注册
*/
router.signUp = function (req, res) {
    // 检查用户名是否存在
    var checkUserExistPromise = User.find({ Email: req.body.Email });
    checkUserExistPromise.then(function (data) {
        if (data.length > 0) {
            res.send(400, '邮箱已存在');
        } else {
            // 检查显示名是否被占用
            var checkDisplayNamePromise = User.find({ DisplayName: req.body.DisplayName });
            checkDisplayNamePromise.then(function (data) {
                if (data.length > 0) {
                    res.send(400, '显示名已被占用');
                } else {
                    var emailVerifyCode = req.body.EmailVerifyCode; // 先对邮箱验证码进行验证
                    client.get(req.body.Email, function (error, response) {
                        if (error) {
                            res.send(500, error);
                        } else {
                            if (response === null) { // 验证码已经过期
                                res.send(400, {});
                            } else if (response === emailVerifyCode) { // 验证码合法
                                // 创建新用户
                                var newUser = new User();
                                var saltResult = "";
                                var hashResult = "";
                                var password = req.body.Password;
                                newUser.Name = req.body.Name;
                                newUser.DisplayName = req.body.DisplayName;
                                newUser.Email = req.body.Email;
                                newUser.CreatedAt = new Date();
                                newUser.LastLoginDate = new Date();
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
                                crypto.randomBytes(128, function (error, salt) {
                                    if (error) {
                                        throw error;
                                    }
                                    saltResult = salt.toString('hex'); // 得到salt
                                    newUser.Salt = saltResult;
                                    crypto.pbkdf2(password, saltResult, 4096, 256, 'sha512', function (error, hash) {
                                        if (error) { throw error; }
                                        hashResult = hash.toString('hex'); //生成密文
                                        newUser.HashedPassword = hashResult;
                                        // save new user
                                        var addNewUserPromise = newUser.save();
                                        addNewUserPromise.then(function (data) { // 注册成功
                                            res.send(200, {
                                                Name: newUser.Name,
                                                DisplayName: newUser.DisplayName,
                                                Email: newUser.Email,
                                                Point: newUser.Point,
                                                _id: data._id
                                            });
                                        }, function (error) {
                                            res.send(error);
                                        });
                                    });
                                });
                            } else { //　验证码未过期但是不合法
                                res.send(400, {});
                            }
                        }
                    });
                }
            }, function (error) {
                res.send(error);
            });
        }
    }, function (error) {
        res.send(error);
    });
}


/*
    登录
*/
router.login = function (req, res) {
    var input = req.body;
    var email = input.Email;
    var password = input.Password;
    // 检查用户名是否合法
    var getUserInstancePromise = User.find({ Email: email }).lean();
    getUserInstancePromise.then(function (data) {
        if (data.length > 0) {
            // 检查密码是否正确
            crypto.pbkdf2(password, data[0].Salt, 4096, 256, 'sha512', function (error, hash) {
                if (error) { throw error; }
                if (hash.toString('hex') === data[0].HashedPassword) {
                    var payload = {
                        email: email,
                        iss: 'thepowersoul'
                    }
                    jsonwebtoken.sign(payload, salt, function (err, token) {
                        if (err) {
                            res.send(400, '登陆出错，请重试');
                        } else {
                            client.set(token, token);
                            client.expire(token, 60000);
                            User.update({ Email: email }, { $set: { 'LastLoginDate': new Date() } }).then(function (updatedData) {
                                res.send(200, {
                                    Name: data[0].Name,
                                    DisplayName: data[0].DisplayName,
                                    Email: data[0].Email,
                                    Point: data[0].Point,
                                    _id: data[0]._id,
                                    SessionID: token,
                                    AvatarID: data[0].AvatarID
                                });
                            }, function (error) {
                                res.send(error);
                            });
                        }
                    })
                } else {
                    res.send(400, '密码错误，请重新输入');
                }
            });
        } else { // 用户名不存在
            res.send(400, '该用户不存在');
        }
    }, function (error) {
        res.send(error);
    });
}

module.exports = router;