let util=require('util');
let StandardError=require('../controllers/common/error.controllers.ARTServer');
module.exports={
    sendMail:function(req,file,cb){
        req.checkBody('Subject').notEmpty();
        req.checkBody('From').notEmpty();
        req.checkBody('To').notEmpty();
        req.checkBody('Body').notEmpty();
        req.getValidationResult()
            .then(result=>{
                if(!result.isEmpty()){
                    req.fileValidationError=new StandardError(util.inspect(result.array()),400);
                    return cb(null,false);
                    
                }
                else{
                    return cb(null,true);
                }                
            });
    }
};