var mongoose = require('mongoose');
var ComplaintMessageSchema = new mongoose.Schema({
    UserID: String, //　举报的用户id
    TargetUserID: String, //被举报的用户id
    Author: String, // 举报者姓名
    Content: String, // 举报具体原因
    TargetID: String, // 举报帖子或者文章的id
    TargetLink: String, // 举报内容的网页链接
    Category: String, // 举报原因类型
    CreatedAt: Date, // 举报信息生成时间
    Status: String, // 举报消息阅读状态
    Type: String, // Topic or Comment or Article
});
module.exports = mongoose.model('ComplaintMessage', ComplaintMessageSchema);