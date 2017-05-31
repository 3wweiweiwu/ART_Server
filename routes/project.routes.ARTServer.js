var express = require('express');
var router = express.Router();
var projectControl=require('../controllers/project/projectBlueprint.controllers.ARTServer')

var validate = require('express-validation')
var projectValidation=require('../validation/project.validation.ArtServer.js')


router.post('/projectBlueprint',validate(projectValidation.blueprintPost),function(req, res, next) {
    return projectControl.createBlueprint(req,res,next);    
});

router.get('/projectBlueprint',(req,res,next)=>{
    return projectControl.getBlueprint(req,res,next,{});
})

router.get('/projectBlueprint/:name',function(req,res,next){
    query={name:req.params.name}
    return projectControl.getBlueprint(req,res,next,query);
})


module.exports = router;