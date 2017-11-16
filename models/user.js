var mongoose = require('mongoose');
var UserSchema = new mongoose.Schema({
    Name: String,
    DisplayName: String,
    Email: String,
    HashedPassword: String,
    AvatarID: String,
    CreatedAt: Date,
    WechatID: String,
   	Point: Number
});
module.exports = mongoose.model('User',UserSchema);