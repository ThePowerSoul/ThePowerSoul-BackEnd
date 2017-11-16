var User = require('../models/user');
var express = require('express');
var router = express.Router();
// var mongoose = require('mongoose');

// mongoose.connect('mongodb://localhost:27017/coffeesdb');
// var db = mongoose.connection;

// db.on('error',function(err){
//     console.log('connection error',err);
// });
// db.once('open',function(){
//     console.log('connected to database');
// });

router.signUp = function(req,res){
    var input = req.body;
    console.log("Hello World")
    // User.find({"email": input.email},function(err,users){
    //     if(users.length == 0){
    //         var user = new User();
    //         user.name = req.body.name;
    //         user.email = req.body.email;
    //         user.password = req.body.password;
    //         user.save(function(err){
    //         if(err){
    //             res.send(err);
    //         }else{
    //             res.json({message: "User Added Successfully!"});
    //         }
    //         });
    //     }else{
    //         res.json({message: "This email has been used!"});
    //     }
    // });
}

router.login = function(req,res){
    var input = req.body;
    // User.find({"email": input.email},function(err,user){
    //  if(user.length != 0){
    //  	if(user[0].password == input.password){
    //         res.json({obj: user[0]});
    //     }else{
    //         res.json({message: "Password wrong!"});
    //     }
    // }else{
    //     res.json({message: "User does not exist!"});
    // }	
    // });
}

module.exports = router;