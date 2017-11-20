var mongoose = require('mongoose');
var ArticleDraftSchema = new mongoose.Schema({
    	UserID: String,
    	Content: String,
    	Title: String,
    	Category: String,
    	CreatedAt: Date,
    	Author: String,
   	    Like: Number,
   	    Dislike: Number
});
module.exports = mongoose.model('ArticleDraft', ArticleDraftSchema);