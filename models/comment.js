var mongoose = require('mongoose');
var CommentSchema = new mongoose.Schema({
    	ID: String,	
    	UserID: String,
    	TopicID: String,
    	Content: String,
    	Title: String,
    	Category: String,
    	CreatedAt: Date,
    	Author: String,
   	Like: Number,
   	Dislike: Number
});
module.exports = mongoose.model('Comment',CommentSchema);