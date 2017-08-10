var express = require('express');
var router = express.Router();
var projectControl=require('../controllers/project/projectBlueprint.controllers.ARTServer')
let scheduleControl=require('../controllers/scheduler/scheduler.controllers.ARTServer')
var validate = require('express-validation')
var scheduleValidation=require('../validation/scheduler.validation.ARTServer')


router.post('/schedule/vision/:vision/blueprint/:blueprint',validate(scheduleValidation.PostNewBlueprintIntoSchedule),function(req, res, next) {
    //schedule a new project and add it into vision based on the blueprint specified
    return scheduleControl.postScheduleFromBlueprint(req,res,next);    
});

router.post('/schedule/:vision',validate(scheduleValidation.getVisionScheduleStatus),function(req,res,next){
    //schedule all projects in the selected vision
    return scheduleControl.postScheduleSignal(req,res,next);
})

// router.get('/schedule/vision/:vision',validate(scheduleValidation.getVisionScheduleStatus),(req,res,next)=>{
//     //
//     return scheduleControl.getScheduleByVision(req,res,next,{});
// })

router.post('/schedule/vision/:vision/next/:project',validate(scheduleValidation.postNextProject),(req,res,next)=>{
    //this url is used to move forward with current task
    //if there is pending_task in the project, it will move forward with pending task
    //otherwise remove current project
    //if current project is removed, then it will move to next project
    
    return scheduleControl.postNextProject(req,res,next,{});
})

router.get('/schedule/machine/:machine/projects',validate(scheduleValidation.getMachineProject),(req,res,next)=>{
    //this url is used to query all the projects in the machine
    return scheduleControl.getMachineProject(req,res,next,{});
});
router.post('/schedule/vision/:vision/vm/:vm/blueprint/:blueprint/task/:task',validate(scheduleValidation.postTaskForVM),(req,res,next)=>{
    //this function is used by the vm manager to schedule a task into the vm
    //this url will delete all project associated with the vm 
    //create a project with specified task
    //then add project into the vm specified.
    return scheduleControl.postTaskForVM(req,res,next);
});
module.exports = router;