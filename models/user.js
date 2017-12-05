var mongoose = require('mongoose');
var UserSchema = new mongoose.Schema({
    Name: String, // 姓名
    DisplayName: String, // 显示名
    Email: String, // 邮箱
    HashedPassword: String, // 密码
    Salt: String, // 盐
    AvatarID: String, // 头像id
    CreatedAt: Date, //  创建时间
    FollowingUsers: Array, // 正在关注的人的id数组
    WechatID: String, // 微信id
    Point: Number, // 积分
    IsVerified: Boolean, // 是否是大v
    VerifiedCategory: String, // 认证分类，个人或组织
    IsAdmin: Boolean, // 是否是管理员
    PhoneNumber: String, // 未验证的手机
    VerifiedPhoneNumber: String, // 验证的手机， 理论上同上
    FollowedTopics: [], // 关注的帖子
    FavTopics: Array, // 收藏的帖子
    FavArticles: Array, // 收藏的文章
    MostRecentConversation: Array // 最近一次和其他用户对话的消息记录id，key为目标用户id，value为消息id
});
module.exports = mongoose.model('User', UserSchema);