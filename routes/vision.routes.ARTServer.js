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

router.get('/vision',(req,res,next)=>{
    return visionControl.get(req,res,next,{});
})

router.get('/vision/:vision_name/registry/:key',validate(visionValidation.post),(req,res,next)=>{
    return visionControl.put(req,res,next);
});

router.put('/vision/:vision_name/key_projects/:projectBlueprint',validate(visionValidation.putKeyProject),function(req,res,next){
    return visionControl.PutKeyProject(req,res,next);
});
router.put('/vision/:vision_name/registry',function(req,res,next){
    return visionControl.put(req,res,next);
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