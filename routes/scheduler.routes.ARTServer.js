var express = require('express');
var router = express.Router();
var projectControl=require('../controllers/project/projectBlueprint.controllers.ARTServer')
let scheduleControl=require('../controllers/scheduler/scheduler.controllers.ARTServer')
var validate = require('express-validation')
var scheduleValidation=require('../validation/scheduler.validation.ARTServer')


router.post('/schedule/vision/:vision/blueprint/:blueprint',validate(scheduleValidation.PostNewBlueprintIntoSchedule),function(req, res, next) {
    return scheduleControl.postScheduleFromBlueprint(req,res,next);    
});

router.post('/schedule',function(req,res,next){
    query={name:req.params.name}
    return scheduleControl.postScheduleSignal(req,res,next,query);
})

router.get('/schedule/vision/:vision',validate(scheduleValidation.getVisionScheduleStatus),(req,res,next)=>{
    return scheduleControl.getScheduleByVision(req,res,next,{});
})




module.exports = router;