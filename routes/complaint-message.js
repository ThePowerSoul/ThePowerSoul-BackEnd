var ComplaintMessage = require('../models/complaint-message');
var express = require('express');
var router = express.Router();

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