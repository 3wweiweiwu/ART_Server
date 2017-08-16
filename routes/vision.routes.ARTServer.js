var express = require('express');
var router = express.Router();
var visionControl=require('../controllers/vision/vision.controllers.ARTServer');

var validate = require('express-validation');
var visionValidation=require('../validation/vision.validation.ArtServer.js');


router.post('/vision/:vision/NewProject/:blueprint',validate(visionValidation.postNewProject),function(req, res, next) {
    //it shall print create a new project based on the blueprint in the vision specified
    return visionControl.postNewProject(req,res,next);    
});

router.post('/vision',validate(visionValidation.post),function(req, res, next) {
    //it shall create a blank vision
    return visionControl.create(req,res,next);    
});



router.get('/vision/:vision_name',validate(visionValidation.getSpecificVision),function(req,res,next){
    //get the vision based on vision name
    let query={name:req.params.vision_name};
    return visionControl.get(req,res,next,query);
});



router.get('/vision/:vision_name/registry/:key',validate(visionValidation.getRegistry),(req,res,next)=>{
    //discontinued...
    return visionControl.GetRegistry(req,res,next);
});


router.get('/vision',(req,res,next)=>{
    //get all visions
    return visionControl.get(req,res,next,{});
});

router.put('/vision/:vision_name/key_projects/:projectBlueprint',validate(visionValidation.putKeyProject),function(req,res,next){
    //add blueprint to the key project
    return visionControl.PutKeyProject(req,res,next);
});
router.put('/vision/:vision_name/registry',validate(visionValidation.putKeyProject),function(req,res,next){
    return visionControl.PutRegistry(req,res,next);
});


router.put('/vision/:vision_name/project_schedule/blueprint/:blueprint/machine/:machine/ask/:ask',validate(visionValidation.putBlueprintMachineInstance),function(req,res,next){
    
    return visionControl.putBlueprintMachineInstance(req,res,next);
});

router.put('/vision/:vision_name/project_schedule/blueprint/:blueprint/server_ask/:ask',validate(visionValidation.putBlueprintServerAsk),function(req,res,next){
    
    return visionControl.putBlueprintServerAsk(req,res,next);
});



router.put('/vision/:vision_name/project_schedule/blueprint/:blueprint/next/:next',validate(visionValidation.putNextBlueprint),function(req,res,next){
    //it shall update next blueprint schedule for the current blueprint
    return visionControl.putNextBlueprint(req,res,next);
});

router.put('/vision/:vision_name/project_schedule/blueprint/:blueprint',validate(visionValidation.putEmptyBlueprintSchedule),function(req,res,next){
    //it shall add current blueprint into the vision's schedule
    return visionControl.PutBlueprint(req,res,next);
});

//project Section
router.put('/vision/:vision_name/current_projects/:project_id/next_task',validate(visionValidation.putNextTask),function(req,res,next){
    //remove current task and get task from pending task
    return visionControl.putNextTask(req,res,next);
});
router.put('/vision/:vision_name/current_projects/:project_id/host/:hostName',validate(visionValidation.putProjectHost),function(req,res,next){
    //update the host name for project
    return visionControl.putProjectHost(req,res,next);
});
router.put('/vision/:vision_name/current_projects/:project_id/status/:status',validate(visionValidation.putProjectStatus),function(req,res,next){
    //update status for project
    return visionControl.putProjectStatus(req,res,next);
});







router.put('/vision',validate(visionValidation.post),function(req,res,next){
    //post and put are essnetially same function....
    return visionControl.create(req,res,next);
});


router.put('/vision/:vision_name/current_projects/:projectName',validate(visionValidation.put),function(req,res,next){
    return visionControl.put(req,res,next);
});

router.delete('/vision/:vision_name/key_projects/:projectName',validate(visionValidation.deleteKeyProject),function(req,res,next){
    return visionControl.deleteKeyProject(req,res,next);
});
router.delete('/vision/:vision_name/current_projects/:projectId',validate(visionValidation.deleteCurrentProject),function(req,res,next){
    return visionControl.deleteCurrentProject(req,res,next);
});
router.delete('/vision/:vision_name/project_schedule/:blueprint',validate(visionValidation.deleteProjectSchedule),function(req,res,next){
    return visionControl.deleteProjectSchedule(req,res,next);
});
router.delete('/vision/:vision_name/project_schedule/:blueprint/machine_demand/:dorm',validate(visionValidation.deleteDormInProjectSchedule),function(req,res,next){
    return visionControl.deleteDormInProjectSchedule(req,res,next);
});
router.delete('/vision/:vision_name/project_schedule/:blueprint/next/:nextBlueprint',validate(visionValidation.deleteNextBlueprintFromSchedule),function(req,res,next){
    return visionControl.deleteNextBlueprintFromSchedule(req,res,next);
});



module.exports = router;