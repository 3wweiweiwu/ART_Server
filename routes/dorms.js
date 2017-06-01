var express = require('express');
var router = express.Router();
var dormControl=require('../controllers/organization/dormControl')
var dormValidation=require('../validation/dorm.validation.ARTServer.js')
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

module.exports = router;