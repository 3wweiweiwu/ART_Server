var express = require('express');
var router = express.Router();
var taskControl=require('../controllers/task/task.controllers.ARTServer')

var validate = require('express-validation')
var taskValidation=require('../validation/task.validation.ArtServer.js')


router.post('/task',validate(taskValidation),function(req, res, next) {
    return taskControl.create(req,res,next);    
});
router.get('/task',(req,res,next)=>{
    return taskControl.get(req,res,next,{});
})
router.get('/task/:task_name',function(req,res,next){
    query={name:req.params.task_name}
    return taskControl.get(req,res,next,query);
})

router.put('/task',validate(taskValidation),function(req,res,next){
    return taskControl.put(req,res,next);
});

module.exports = router;