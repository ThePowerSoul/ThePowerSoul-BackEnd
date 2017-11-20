var mongoose = require('mongoose');
var CommentSchema = new mongoose.Schema({
	TargetContextID: String,
	UserID: String,
	TargetUserID: String,
	Author: String,
	TargetAuthor: String,
	TopicID: String,
	Content: String,
	Title: String,
	Category: String,
	CreatedAt: Date,
	Like: Number,
	Dislike: Number
});
module.exports = mongoose.model('Comment',CommentSchema);