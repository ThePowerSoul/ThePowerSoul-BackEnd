var mongoose = require('mongoose');
var TopicSchema = new mongoose.Schema({
    	ID: String,	
    	UserID: String,
    	Content: String,
    	Title: String,
    	Category: String,
    	CreatedAt: Date,
    	Author: String,
   	Like: Number,
   	Dislike: Number
});
module.exports = mongoose.model('Topic',TopicSchema);