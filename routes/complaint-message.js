var ComplaintMessage = require('../models/complaint-message');
var express = require('express');
var router = express.Router();

router.addNewComplaintMessage = function(req, res) {
    var user_id = req.params.user_id;
    var input = req.body;
    var complaintMesssage = new ComplaintMessage();
    complaintMesssage.UserID = user_id;
    complaintMesssage.Author = input.Author;
    complaintMesssage.Content = input.Content;
    complaintMesssage.TargetID = input.TargetID;
    complaintMesssage.TargetLink = input.TargetLink;
    complaintMesssage.Category = input.Category;
    complaintMesssage.CreatedAt = new Date();
    complaintMesssage.Status = "0";
    complaintMesssage.save()
        .then(function(data) {
            res.send(200, data);
        }, function(error) {
            res.send(error);
        });
}

router.setRead = function(req, res) {
    var message_id = req.params.message_id;
    ComplaintMessage.update({_id: message_id}, {'$set': {'Status': '1'}})
        .then(function(data) {
            res.send(200, data);
        }, function(error) {
            res.send(error);
        });
}

router.getUnreadComplaintMessages = function(req, res) {
    ComplaintMessage.find({'Status': '0'}).then(function(data) {
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
}

router.getAllComplaintMessages = function(req, res) {
    ComplaintMessage.find().then(function(data) {
        res.send(200, data);
    }, function(error) {
        res.send(error);
    });
}

module.exports = router;