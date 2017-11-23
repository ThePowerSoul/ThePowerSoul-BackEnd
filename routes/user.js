var User = require('../models/user');
var express = require('express');
var router = express.Router();

router.getDetail = function(req, res) {
    var user_id = req.params.user_id;
    var getUserDetailPromise = User.find({_id: user_id});
    getUserDetailPromise.then(function(data) {
        //
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