var express = require('express');
var router = express.Router();
// 第三方套件
const md5 = require('blueimp-md5')
const svgCaptcha = require('svg-captcha')

const users = {}
const ajax = require('../api/ajax')
const utils = require('../util/utils')
// 連接mongodb資料庫取得UserModel
const UserModel = require('../db/models').getModel('user')

/**
 * 01_根據經緯度獲得位置詳情
 */
router.get('/position/:geohash', function (req, res) {
    const { geohash } = req.params
    console.log('[01_根據經緯度獲得位置詳情] geohash : ' + geohash)
    // 查找其他外部API取得相關經緯度
    ajax(`http://cangdu.org:8001/v2/pois/${geohash}`)
        .then(data => {
            res.send({ code: 0, data })
        })
})

/**
 * 02_取得食品分類清單
 */
router.get('/index_category', function (req, res) {
    console.log('[02_取得食品分類清單]')
    setTimeout(function () {
        const data = require('../data/index_category.json')
        res.send({ code: 0, data })
    }, 300)
})

/**
 * 03_根據經緯度獲取商鋪清單
 */
router.get('/shops', function (req, res) {
    const latitude = req.query.latitude
    const longitude = req.query.longitude
    console.log('[03_根據經緯度獲取商鋪清單] latitude : ' + latitude + ' longitude : ' + longitude)
    //
    setTimeout(function () {
        const data = require('../data/shops.json')
        res.send({ code: 0, data })
    }, 300)
})

/**
 * 04_根據經緯度和關鍵字搜索商鋪列表
 */
const searchUrl = 'http://cangdu.org:8001/v4/restaurants'
router.get('/search_shops', function (req, res) {
    const { geohash, keyword } = req.query
    console.log('[04_根據經緯度和關鍵字搜索商鋪列表] geohash : ' + geohash + ' keyword : ' + keyword)
    //
    ajax(searchUrl, {
        'extras[]': 'restaurant_activity',
        geohash,
        keyword,
        type: 'search'
    }).then(data => {
        res.send({ code: 0, data })
    })
})

/**
 * 05_單次圖形驗證碼
 */
router.get('/captcha', function (req, res) {
    var captcha = svgCaptcha.create({
        ignoreChars: '0o1l',
        noise: 2,
        color: true
    });
    req.session.captcha = captcha.text.toLowerCase();
    console.log('[05_單次圖形驗證碼] captcha : ' + req.session.captcha + ' _id : ' + req.session.id)
    res.type('svg');
    res.send(captcha.data)
});

/**
 * 06_登入_用戶名密碼
 */
router.post('/login_pwd', function (req, res) {
    const reqName = req.body.name // 使用者帳號
    const reqPwd = md5(req.body.pwd) // 使用者密碼
    const reqCaptcha = req.body.captcha.toLowerCase() //使用者輸入的單次圖形驗證碼
    const orgCaptcha = req.session.captcha // 存放在session的單次圖形驗證碼
    console.log('[06_(登入)用戶名密碼] name : ' + reqName + ' pwd : ' + reqPwd + ' captcha : ' + reqCaptcha)
    // 1. 檢查單次驗證碼是否正確
    if (orgCaptcha !== reqCaptcha) {
        return res.send({ code: 1, msg: '驗證碼不正確' })
    }
    // 刪除存放在session內的單次驗證碼
    delete req.session.captcha
    // 2. 查找資料庫
    UserModel.findOne({ reqName }, function (err, user) {
        if (user) { // 檢查資料庫是否有該使用者帳號
            const orgPwd = user.pwd
            if (orgPwd === reqPwd) { // 檢查使用者密碼
                req.session.userid = user._id
                return res.send({ code: 0, data: { _id: user._id, name: user.name, phone: user.phone } })
            } else {
                return res.send({ code: 1, msg: '用戶名稱或密碼不正確!' })
            }
        } else {
            const newUserModel = new UserModel({ reqName, reqPwd })
            newUserModel.save(function (err, user) {
                req.session.userid = user._id
                return res.send({ code: 0, data: { _id: user._id, name: user.name } })
            })
        } // end_if
    })
})

/**
 * 07_登入_手機號碼驗證碼
 */
router.post('/login_sms', function (req, res, next) {
    const phone = req.body.phone; // 手機號碼
    const code = req.body.code; // 短信驗證碼
    console.log('[07_登入_手機號碼驗證碼] Phone : ' + phone + ' Code : ' + code)
    // 1. 參數檢查
    if (phone === undefined || code === undefined) {
        return res.send({ code: 1, msg: '手機號碼或驗證碼不正確!' });
    }
    // 2. 檢查手機驗證碼是否正確
    if (users[phone] !== code) {
        return res.send({ code: 1, msg: '手機號碼或驗證碼不正確!' });
    }
    // 3. 刪除保存的驗證碼
    delete users[phone];
    // 4. 查找資料庫
    UserModel.findOne({ phone }, function (err, user) {
        if (user) { // 檢查資料庫是否有該使用者帳號
            req.session.userid = user._id
            return res.send({ code: 0, data: user })
        } else {
            // 新增數據
            const userModel = new UserModel({ phone })
            userModel.save(function (err, user) {
                req.session.userid = user._id
                return res.send({ code: 0, data: user })
            })
        }
    })
})

/**
 * 08_發送一次性短信驗證碼
 */
router.get('/sendcode', function (req, res, next) {
    // 1. 取得電話號碼
    const phone = req.query.phone
    // 2. 產生驗證碼(6碼隨機數字)
    const code = utils.randomCode(6);
    // 3. 發送驗證碼給指定電話號碼
    console.log('[08_發送一次性短信驗證碼] Phone : ' + phone + ' Code : ' + code)
    // 模擬發送簡訊驗證碼的延遲時間
    let computeTime = Math.floor(Math.random() * 10) // 亂數回傳0~9
    const intervalId = setInterval(() => {
        console.log('延遲時間:' + computeTime)
        computeTime--
        if (computeTime <= 0) {
            users[phone] = code
            console.log('保存驗證碼Phone : ' + phone + ' Code : ' + code)
            res.send({ "code": 0 })
            clearInterval(intervalId) // 清除計時器
        }
    }, 1000)
})

/**
 * 09_根據會話獲取用戶信息
 */
const _filter = { 'pwd': 0, '__v': 0 } // 過濾掉以下參數
router.get('/userinfo', function (req, res) {
    // 1. 取得UserId
    const userid = req.session.userid
    console.log('[09_根據會話獲取用戶信息] userid : ' + userid)
    if (userid) {
        // 2. 查詢資料庫
        UserModel.findOne({ _id: userid }, _filter, function (err, user) {
            if (user) { // 檢查資料庫是否有該使用者帳號
                return res.send({ code: 0, data: user })
            } else {
                // 清除瀏覽器保存的UserId
                delete req.session.userid
            }// end_if
        })
    }
    return res.send({ code: 1, msg: '請先登入' })
})

/**
 * 10_用戶帳號登出
 */
router.get('/logout', function (req, res) {
    // 清除瀏覽器保存的UserId
    delete req.session.userid
    // 返回数据
    res.send({ code: 0 })
})

module.exports = router;
