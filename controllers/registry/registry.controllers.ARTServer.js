let registryModel=require('../../model/registry/registry.model.ARTServer')
let CreateStandardError=require('../common/error.controllers.ARTServer')
exports.FindRegistry=function(vision,project,task,key){
    return new Promise((resolve,reject)=>{
        registryModel.findOne({vision:vision,project:project,task:task,key:key})
            .exec((err,registry)=>{
                if(err){
                    reject(CreateStandardError(err,500));
                }
                else if(registry==null){
                    reject(CreateStandardError({result:'error',note:`unable to find registry specified ${vision}-${project}-${task}-${key}`},400));
                }
                else{
                    resolve(registry.value);
                }                 
            });
    });
}

exports.getRegistry=function(req,res,next){
    exports.FindRegistry(req.params.vision,req.params.project,req.params.task,req.params.key)
        .then((value)=>{
            res.status(200).json({result:value});
        })
        .catch(err=>{
            res.status(err.status).json({err});
        })    
}
exports.updateRegistry=function(vision,project,task,key,value){
    return new Promise((resolve,reject)=>{
        registryModel.update({vision:vision,project:project,task:task,key:key},{$set:{value:value}},{upsert:true},(err,raw)=>{
            if(err){
                reject(CreateStandardError(err,500));
            }
            else{
                resolve(raw);
            }
        });
    });
    

    
}
exports.postRegistry=function(req,res,next){
    exports.updateRegistry(req.params.vision,req.params.project,req.params.task,req.params.key,req.body.value)
        .then((raw)=>{
            res.status(200).json(raw);
        })
        .catch(err=>{
            res.status(err.err.status).json(err);
        })
}