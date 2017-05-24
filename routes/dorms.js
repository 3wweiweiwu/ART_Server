var express = require('express');
var router = express.Router();
var dormControl=require('../controllers/organization/dormControl')
router.post('/dorm', function(req, res, next) {
    return dormControl.create(req,res,next);
    
});
router.get('/dorm',function(req,res,next){
    return dormControl.get(req,res,next);
})

router.put('/dorm',function(req,res,next){
    return dormControl.putDorm(req,res,next);
});

module.exports = router;