var express = require('express');
var router = express.Router();
var validate = require('express-validation');
var registryValidation=require('../validation/registry.validation.ARTServer');
let registryControl=require('../controllers/registry/registry.controllers.ARTServer');


router.get('/registry/vision/:vision/project/:project/task/:task/key/:key/all',validate(registryValidation.GetRegistry),(req,res)=>{    
    //it shall get the value for the key specified
    return registryControl.getAllRegistryInfo(req.params.vision,req.params.project,req.params.task,req.params.key)
        .then((result)=>{
            res.status(200).json(result);
        })
        .catch((err)=>{
            res.status(err.status).json(err);
        });
});
router.get('/registry/vision/:vision/project/:project/task/:task/key/:key',validate(registryValidation.GetRegistry),(req,res,next)=>{    
    //it shall get the value for the key specified
    return registryControl.getRegistryValue(req,res,next);
});


router.post('/registry/vision/:vision/project/:project/task/:task/key/:key',validate(registryValidation.PostRegistry),(req,res,next)=>{    
    //it shall write value for the key specified
    return registryControl.writeRegistry(req,res,next);
});

router.put('/registry/vision/:vision/project/:project/task/:task/key/:key/expired',validate(registryValidation.isRegistryExpired),(req,res)=>{
    return registryControl.setRegistryExpired(req.params.vision,req.params.project,req.params.task,req.params.key)
        .then((result)=>{
            res.status(200).json({result});
        })
        .catch((err)=>{
            res.status(err.status).json(err);
        });
});

router.get('/registry/vision/:vision/project/:project/task/:task/key/:key/expired',validate(registryValidation.isRegistryExpired),(req,res)=>{
    return registryControl.isRegistryExpired(req.params.vision,req.params.project,req.params.task,req.params.key)
        .then((result)=>{
            res.status(200).json(result);
        })
        .catch((err)=>{
            res.status(err.status).json(err);
        });    
});


module.exports = router;