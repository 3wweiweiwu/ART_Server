var express = require('express');
var router = express.Router();
var projectBlueprint=require('../controllers/project/projectBlueprint.controllers.ARTServer')
let projectControl=require('../controllers/project/project.controllers.ARTServer')
var validate = require('express-validation')
var projectValidation=require('../validation/project.validation.ArtServer.js')


router.post('/projectBlueprint',validate(projectValidation.blueprintPost),function(req, res, next) {
    return projectBlueprint.createBlueprint(req,res,next);    
});

router.get('/projectBlueprint',(req,res,next)=>{
    return projectBlueprint.getBlueprint(req,res,next,{});
})

router.get('/projectBlueprint/:name',function(req,res,next){
    query={name:req.params.name}
    return projectBlueprint.getBlueprint(req,res,next,query);
})

router.put('/project/:projectId/status/:statusId',validate(projectValidation.projectPut),function(req,res,next){
    return projectControl.putProjectStatus(req,res,next);
});

router.put('/project/:projectId/PID/:dormId',validate(projectValidation.putDormIdToProject),function(req,res,next){
    return projectControl.putPIDToProject(req,res,next);
});

router.put('/project/:projectId/VID/:dormId',validate(projectValidation.putDormIdToProject),function(req,res,next){
    return projectControl.putDormIdToProject(req,res,next);
});

module.exports = router;