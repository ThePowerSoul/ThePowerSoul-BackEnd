var mongoose = require('mongoose');
var CommentSchema = new mongoose.Schema({
	TargetContextID: String, // 目标上下文id
	UserID: String, // 发表当前评论的用户id
	TargetUserID: String, // 发表之前评论的用户id
	Author: String, // 发表当前评论的用户名
	TargetAuthor: String, // 发表之前评论的用户名
	TopicID: String, // 帖子的id
	Content: String,
	Title: String,
	Category: String,
	CreatedAt: Date,
	LikeUser: [],
	DislikeUser: []
});
module.exports = mongoose.model('Comment',CommentSchema);