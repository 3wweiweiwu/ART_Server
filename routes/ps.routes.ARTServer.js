var express = require('express');
var router = express.Router();
//var projectControl=require('../controllers/project/projectBlueprint.controllers.ARTServer')
//let scheduleControl=require('../controllers/scheduler/scheduler.controllers.ARTServer')
//var validate = require('express-validation')
//var scheduleValidation=require('../validation/scheduler.validation.ARTServer')
var fs = require('fs');
let config=require('../config');
let os=require('os');
router.get('/ps/Library.ps1',(req,res)=>{
    fs.readFile( '\\\\nhqa-w81-q10.qae.aspentech.com\\v6\\wwwErrorAnalysis.ps1', function (err, data) {
        if (err) {
            res.status(500).send(err);
        }
        else{
            res.status(200).send(data);
        }

    });

});

router.get('/ps/:psname',(req,res)=>{
    let relativePath=req.params.psname.replace(/@/g,'\\');
    let dest=`.\\powershell\\${relativePath}`;
    fs.readFile(dest,(err,data)=>{
        if(err){
            res.status(500).send(err);
            return;
        }
        else{
            //loop through the file, replace all develop server with target server's address
            let text=data;
            config.powershell.development_list.forEach(item=>{
                //text=text.toString().replace(item,`${os.hostname()}.qae.aspentech.com:${config.express.port}`);
                text=text.toString().replace(item,`${os.hostname()}.qae.aspentech.com:${config.express.port}`);
            });
            res.status(200).send(text);
            return;
        }
        
    });
    


});
router.get('/ps/tunnel/:path',(req,res)=>{
    let path=req.params.path.replace(/@/g,'\\');
    fs.access(path,fs.constants.R_OK,err=>{
        if(err)
        {
            res.status(400).send(err);
        }
        else{
            res.download(path);
        }
    });
});
module.exports = router;