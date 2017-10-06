var express = require('express');
var router = express.Router();

let mailControl=require('../controllers/mail/mail.controllers.ARTServer');
router.post('/mail',mailControl.multerUpload.single('file'),function(req,res){
    mailControl.SendMail(req.body.From,req.body.To,req.body.Subject,req.body.Body,req.file)
        .then(()=>{
            res.json();
        })
        .catch(err=>{
            res.status(err.status).json(err);
        });
});

module.exports=router;