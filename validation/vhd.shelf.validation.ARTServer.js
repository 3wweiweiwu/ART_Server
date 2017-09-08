var Joi=require('joi');
let util=require('util');
let StandardError=require('../controllers/common/error.controllers.ARTServer');
module.exports={
    getUploadPath:{
        body:{
            created_by:Joi.string().required(),            
            size_byte:Joi.number().required(),
            os:Joi.string().required(),
            installed_products:Joi.array().required()            
        }
    },
    updateVHDKeeperInfo:{
        params:{
            id:Joi.string().required()
        }        
    },
    getVHDDownload:{
        params:{
            id:Joi.string().required()
        }
    },
    postNewSeries:{
        params:{
            name:Joi.string().required()
        }
    },
    getNewSeries:{
        params:{
            name:Joi.string().required()
        }
    },
    updateSeriesVHDSlot:{
        params:{
            name:Joi.string().required(),
            number:Joi.number().required()
        }
    },
    getSubscription:{
        params:{
            name:Joi.string().required(),
            vision:Joi.string().required()
        }
    },
    addSeriesSubscriber:{
        params:{
            name:Joi.string().required(),
            vision:Joi.string().required()
        }        
    },
    delSeriesSubscriber:{
        params:{
            name:Joi.string().required(),
            vision:Joi.string().required()
        }        
    },    
    upload:function(req,file,cb){
        

        
        req.checkBody('installed_products').eachIsNotEmpty('name');
        req.checkBody('installed_products').eachIsNotEmpty('version');
        req.checkBody('installed_products').eachIsNotEmpty('build');        
        req.checkBody('installed_media').notEmpty();        
        req.checkBody('series').notEmpty();       
        
        //check if body is correct
        req.checkBody('created_by').notEmpty();
        
        req.checkBody('os').notEmpty();
        req.getValidationResult()
            .then(result=>{
                if(!result.isEmpty()){
                    req.fileValidationError=new StandardError(util.inspect(result.array()),400);
                    return cb(null,false);
                    
                }
                else{
                    //sanitize body                    
                    req.body.installed_products=JSON.parse(req.body.installed_products);
                    req.body.installed_media=JSON.parse(req.body.installed_media);
                    return cb(null,true);
                }
            });
        
    }
};