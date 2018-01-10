var mongoose = require('mongoose');
var TopicSchema = new mongoose.Schema({
	UserID: String,
	Content: String,
	Title: String,
	Category: String,
	CreatedAt: Date,
	Author: String,
	AvatarID: String,
	View: Number,
	LikeUser: [],
	DislikeUser: [],
	ReportUsers: []
});
module.exports = mongoose.model('Topic',TopicSchema);