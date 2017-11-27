var mongoose = require('mongoose');
var TopicSchema = new mongoose.Schema({
	UserID: String,
	Content: String,
	Title: String,
	Category: String,
	CreatedAt: Date,
	Author: String,
	LikeUser: [],
	DislikeUser: []
});
module.exports = mongoose.model('Topic',TopicSchema);