var express = require('express');
var router = express.Router();
var projectControl=require('../controllers/project/projectBlueprint.controllers.ARTServer')
let scheduleControl=require('../controllers/scheduler/scheduler.controllers.ARTServer')
var validate = require('express-validation')
var scheduleValidation=require('../validation/scheduler.validation.ARTServer')
var fs = require('fs');

router.get('/ps/Library.ps1',(req,res)=>{
    fs.readFile( '\\\\nhqa-w81-q10\\v6\\wwwErrorAnalysis.ps1', function (err, data) {
        if (err) {
            res.status(500).send(err);
        }
        else{
            res.status(200).send(data);
        }

    });

})

router.get('/ps/:psname',(req,res)=>{
    let relativePath=req.params.psname.replace('@','\\');
    let dest=`C:\\Users\\Administrator\\ARTServer\\Powershell\\${relativePath}`;
    res.download(dest);


})
router.get('/iso/a.iso',(req,res)=>{
    
    let dest=`e:\\VHD\\mvt-1.vhd`;
    res.download(dest);


})
module.exports = router;