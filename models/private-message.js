var mongoose = require('mongoose');
var PrivateMessageSchema = new mongoose.Schema({
	UserID: String, // 发私信的用户id
	TargetUserID: String, // 接受私信的用户id
	Author: String, // 发私信的用户名
	TargetUserName: String, // 接受私信的用户名
	Content: String, // 私信内容
	CreatedAt: Date, // 创建时间
});
module.exports = mongoose.model('PrivateMessage',PrivateMessageSchema);