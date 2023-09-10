/**
 * 產生指定長度的隨機亂數
 */
function randomCode(length) {
    const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let result = '';
    for (var i = 0; i < length; i++) {
        var index = Math.ceil(Math.random() * 9);
        result += chars[index];
    }
    return result;
};

exports.randomCode = randomCode;
