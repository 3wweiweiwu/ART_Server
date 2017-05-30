var express = require('express');
var router = express.Router();
var backgroundControl=require('../controllers/organization/background.controllers.ARTServer')
var validate = require('express-validation')
var backgroundsValidation=require('../validation/background.validation.artserver.js')

router.post('/background', validate(backgroundsValidation.post),function(req, res, next) {
    return backgroundControl.CreateNew(req,res,next);
    
});
router.get('/background',function(req,res,next){
    return backgroundControl.get(req,res,next);
})

router.put('/background',validate(backgroundsValidation.post),function(req,res,next){
    return backgroundControl.UpdateRecord(req,res,next);
});

module.exports = router;