var User = require('../models/user');
var express = require('express');
var router = express.Router();

/*
    注册
*/
router.signUp = function(req, res){
    // 检查用户名是否存在
    var checkUserExistPromise = User.find({Email: req.body.Email});
    checkUserExistPromise.then(function(data) {
        if (data.length > 0) {
            res.json({Message: "user exist"});
        } else {
            // 检查显示名是否被占用
            var checkDisplayNamePromise = User.find({DisplayName: req.body.DisplayName});
            checkDisplayNamePromise.then(function(data) {
                // 
                if(data.length > 0) {
                    res.json({Message: "displayname exist"});
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
                    addNewUserPromise.then(function(data) {
                        res.json({Message: "Add User Successfully"});
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
}

module.exports = router;