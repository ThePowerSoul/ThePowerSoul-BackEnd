var mongoose = require('mongoose');
var UserSchema = new mongoose.Schema({
    Name: String, // 姓名
    DisplayName: String, // 显示名
    Email: String, // 邮箱
    HashedPassword: String, // 密码
    AvatarID: String, // 头像id
    CreatedAt: Date, //  创建时间
    WechatID: String, // 微信id
    Point: Number, // 积分
    IsVerified: Boolean, // 是否是大v
    VerifiedCategory: String, // 认证分类，个人或组织
    IsAdmin: Boolean, // 是否是管理员
    PhoneNumber: String, // 未验证的手机
    VerifiedPhoneNumber: String // 验证的手机， 理论上同上
});
module.exports = mongoose.model('User',UserSchema);