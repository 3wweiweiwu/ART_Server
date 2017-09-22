var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
let validator=require('validator');
var config=require('./config.js');
var index = require('./routes/index');
var users = require('./routes/users');
var backgrounds=require('./routes/background.routes.ARTServer');
var task=require('./routes/task.routes.ARTServer');
var project=require('./routes/project.routes.ARTServer');
var expressValidator = require('express-validator');
var dorms=require('./routes/dorms.js');
var vision=require('./routes/vision.routes.ARTServer');
let scheduler=require('./routes/scheduler.routes.ARTServer');
let powershell=require('./routes/ps.routes.ARTServer');
let registry=require('./routes/registry.routes.ARTServer');
let shelf=require('./routes/vhd.shelf.routes.ARTServer');



var app = express();




//mongoose ODM
var mongoose=require('mongoose');
mongoose.connect(config.dbAddress);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit:'1024000mb'}));
app.use(bodyParser.urlencoded({ extended: true,limit:'1024000mb' }));
app.use(expressValidator({
    customValidators:{
        eachIsNotEmpty:function(values,prop){
            let list=null;
            if(typeof(values)=='string' && validator.isJSON(values)){
                list=JSON.parse(values);
            }
            else{
                list=values;
            }
            let result=false;
            try{
                result= list.every(function(val){
                    return !validator.isEmpty(val[prop].toString());
                });
            }
            catch(err){
                result=false;
            }

            
            return result;
        }
    }
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/api',dorms);
app.use('/api',backgrounds);
app.use('/api',task);
app.use('/api',project);
app.use('/api',vision);
app.use('/api',scheduler);
app.use('/api',powershell);
app.use('/api',registry);
app.use('/api',shelf);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
