/**
 * ajax 請求函數模塊
 * 返回值:promise對象(異步返回數據為:response.data)
 */
const axios = require('axios')

module.exports = function ajax(url, data = {}, type = 'GET') {
    return new Promise(function (resolve, reject) {
        // 執行異步ajax請求
        let promise // 返回值
        if (type === 'GET') { // GET 請求
            // 處理url參數數據
            let dataStr = ''
            Object.keys(data).forEach(key => {
                dataStr += key + '=' + data[key] + '&'
            })
            // 處理Url網址
            if (dataStr !== '') {
                dataStr = dataStr.substring(0, dataStr.lastIndexOf('&'))
                url = url + '?' + dataStr
            }
            // 發送GET請求
            promise = axios.get(url)
        } else { // POST 請求
            promise = axios.post(url, data)
        }
        promise.then(function (response) {
            // (成功)調用resolve()
            resolve(response.data)
        }).catch(function (error) {
            // (失敗)調用reject()
            reject(error)
        })
    })
}