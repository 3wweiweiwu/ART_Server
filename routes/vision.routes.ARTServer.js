var express = require('express');
var router = express.Router();
var visionControl=require('../controllers/vision/vision.controllers.ARTServer')

var validate = require('express-validation')
var visionValidation=require('../validation/vision.validation.ArtServer.js')


router.post('/vision',validate(visionValidation.post),function(req, res, next) {
    return visionControl.create(req,res,next);    
});

router.get('/vision/:vision_name',validate(visionValidation.getSpecificVision),function(req,res,next){
    query={name:req.params.vision_name}
    return visionControl.get(req,res,next,query);
})



router.get('/vision/:vision_name/registry/:key',validate(visionValidation.getRegistry),(req,res,next)=>{
    return visionControl.GetRegistry(req,res,next);
});


router.get('/vision',(req,res,next)=>{
    return visionControl.get(req,res,next,{});
})

router.put('/vision/:vision_name/key_projects/:projectBlueprint',validate(visionValidation.putKeyProject),function(req,res,next){
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


router.put('/vision/:vision_name/project_schedule/blueprint/:blueprint',validate(visionValidation.putEmptyBlueprintSchedule),function(req,res,next){
    return visionControl.PutBlueprint(req,res,next);
});


router.put('/vision',validate(visionValidation.post),function(req,res,next){
    //post and put are essnetially same function....
    return visionControl.create(req,res,next);
});


router.put('/vision/:vision_name/current_projects/:projectName',function(req,res,next){
    return visionControl.put(req,res,next);
});

router.delete('/vision/:vision_name/key_projects/:projectName',function(req,res,next){
    return visionControl.put(req,res,next);
});
router.delete('/vision/:vision_name/current_projects/:projectId',function(req,res,next){
    return visionControl.put(req,res,next);
});






module.exports = router;