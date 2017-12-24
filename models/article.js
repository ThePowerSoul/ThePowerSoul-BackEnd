var mongoose = require('mongoose');
var ArticleSchema = new mongoose.Schema({
	UserID: String,
	Content: String,
	Title: String,
	Category: String,
	CreatedAt: Date,
	Author: String,
	IsArticle: Boolean,
	LikeUser: [],
	DislikeUser: []
});
module.exports = mongoose.model('Article', ArticleSchema);