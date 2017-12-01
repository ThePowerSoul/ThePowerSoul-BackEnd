var mongoose = require('mongoose');
var PrivateMessageSchema = new mongoose.Schema({
	UserID: String, // 发私信的用户id
	TargetUserID: String, // 接受私信的用户id
	UserName: String, // 发私信的用户名
	TargetUserName: String, // 接受私信的用户名
	UserDelStatus: Boolean, // 发私信的用户是否删除了这条
	TargetUserDelStatus: Boolean, // 接受私信的用户是否删除了这条
	MessageType: String, // 消息的类型, 0普通消息，1系统消息
	Content: String, // 私信内容
	CreatedAt: Date, // 创建时间
	Status: String // 状态， 未读， 已读 --> 0, 1
});
module.exports = mongoose.model('PrivateMessage',PrivateMessageSchema);