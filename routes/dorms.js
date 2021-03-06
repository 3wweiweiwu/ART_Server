var express = require('express');
var router = express.Router();
var dormControl=require('../controllers/organization/dormControl')
var dormValidation=require('../validation/dorm.validation.ARTServer.js')
var validate = require('express-validation')
router.post('/dorm', function(req, res, next) {
    return dormControl.create(req,res,next);
    
    
});


router.get('/dorm',function(req,res,next){
    return dormControl.get(req,res,next,{});
})

router.put('/dorm',function(req,res,next){
    return dormControl.putDorm(req,res,next);
});

router.get('/dorm/:name',function(req,res,next){
    let query={name:req.params.name}
    return dormControl.get(req,res,next,query);
});

router.put('/dorm/DiskInitializationSignal/:dormName',validate(dormValidation.PutDiskInitializationSignal),function(req,res,next){
    return dormControl.PutDiskInitializationSignal(req,res,next);
});

router.put('/dorm/:dormName/vm/:size_mb/drive/:driveLetter',validate(dormValidation.PutVMToDorm),function(req,res,next){
    return dormControl.PutVMToDorm(req,res,next);
});

router.delete('/dorm/:dormName',validate(dormValidation.DeleteDorm),function(req,res){
    dormControl.DeleteDorm(req.params.dormName)
        .then(()=>{
            res.json();
        })
        .catch(err=>{
            res.status(err.status).json(err);
        })

});

router.put('/dorm/refresh/:dormName',validate(dormValidation.RefreshDorm),function(req,res,next){
    dormControl.RefreshDorm(req.params.dormName)
        .then(raw=>{
            res.json(raw);
        })
        .catch(err=>{
            res.status(err.status).json(err);
        });
})
module.exports = router;