var express = require('express');
var router = express.Router();
var projectControl=require('../controllers/project/projectBlueprint.controllers.ARTServer')
let scheduleControl=require('../controllers/scheduler/scheduler.controllers.ARTServer')
var validate = require('express-validation')
var registryValidation=require('../validation/registry.validation.ARTServer')
let registryControl=require('../controllers/registry/registry.controllers.ARTServer')
var fs = require('fs');

var registryValidation=require('../validation/registry.validation.ARTServer')
router.get('/registry/vision/:vision/project/:project/task/:task/key/:key',validate(registryValidation.GetRegistry),(req,res,next)=>{    
    //it shall get the value for the key specified
    return registryControl.getRegistry(req,res,next);
})


router.post('/registry/vision/:vision/project/:project/task/:task/key/:key',validate(registryValidation.PostRegistry),(req,res,next)=>{    
    //it shall write value for the key specified
    return registryControl.postRegistry(req,res,next);
})


module.exports = router;