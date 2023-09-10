/**
 * mongodb資料庫集合的Model模塊
 * 1. 連接資料庫
 * 2. 定義特定的Model
 * 3. 對外暴露Model方法
 */

// 1. 連接資料庫
const mongoose = require('mongoose')
const dbUrl = 'mongodb://127.0.0.1:27017/goodshop'
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
const conn = mongoose.connection
conn.on('connected', function () {
    console.log('資料庫連結成功!')
})

// 2. Model : UserModel
const userSchema = mongoose.Schema({
    // 用戶名稱
    'name': { type: String },
    // 用戶密碼
    'pwd': { type: String },
    // 帳戶類型
    'phone': { 'type': String }
})
UserModel = mongoose.model('user', userSchema)

// 3.對外暴露方法
module.exports = {
    getModel(name) {
        return mongoose.model(name)
    }
}