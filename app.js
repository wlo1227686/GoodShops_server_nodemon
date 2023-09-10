var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var index = require('./routes/index');

var path = require('path');
var logger = require('morgan');
var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json()); // 解析JSON格式的請求資料
app.use(bodyParser.urlencoded({ extended: false })); //解析Url encoded格式的請求資料
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// session設定
app.use(session({
    secret: '12345',
    cookie: { maxAge: 1000 * 60 * 1 * 1 },  //設置maxAge(單位1000ms) 1000 *( 60 * 60 * 24 ) 
    resave: false,
    saveUninitialized: true,
}));

// routes需放在相關設定之後
app.use('/', index); // 載入rotues

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


module.exports = app;
