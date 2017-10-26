let registryModel=require('../../model/registry/registry.model.ARTServer');
let CreateStandardError=require('../common/error.controllers.ARTServer');

let registry=function(){
    const getRegistry=function(vision,project,task,key){
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
                        resolve(registry);
                    }                 
                });
        });
    };
    const FindRegistry=function(vision,project,task,key){
        //return the value of the registry specified
        return new Promise((resolve,reject)=>{
            getRegistry(vision,project,task,key)
                .then(result=>{
                    resolve(result.value);
                })
                .catch(err=>{
                    reject(CreateStandardError(err,500));
                });
        });
    };

    const getRegistryValue=function(req,res){
        FindRegistry(req.params.vision,req.params.project,req.params.task,req.params.key)
            .then((value)=>{
                res.status(200).json({result:value});
            })
            .catch(err=>{
                res.status(err.status).json({err});
            });    
    };

    const updateRegistry=function(vision,project,task,key,value){
        return new Promise((resolve,reject)=>{
            
            registryModel.update({vision:vision,project:project,task:task,key:key},{$set:{value:value,expired:false,timestamp:Date.now()}},{upsert:true},(err,raw)=>{
                if(err){
                    reject(CreateStandardError(err,500));
                }
                else{
                    resolve(raw);
                }
            });
        });
        
    
        
    };
    const writeRegistry=function(req,res){
        updateRegistry(req.params.vision,req.params.project,req.params.task,req.params.key,req.body.value)
            .then((raw)=>{
                res.status(200).json(raw);
            })
            .catch(err=>{
                res.status(err.status).json(err);
            });
    };
    const setRegistryExpired=function(vision,project,task,key){
        return new Promise((resolve,reject)=>{
            registryModel.update({vision:vision,project:project,task:task,key:key},{$set:{expired:true,timestamp:Date.now()}},{upsert:false},(err,raw)=>{
                if(err){
                    reject(CreateStandardError(err,500));
                }
                else{
                    resolve(raw);
                }
            });
        });
    };
    const isRegistryExpired=function(vision,project,task,key){
        //return the value of the registry specified
        return new Promise((resolve,reject)=>{
            getRegistry(vision,project,task,key)
                .then(result=>{
                    resolve({expired:result.expired});
                })
                .catch(err=>{
                    reject(CreateStandardError(err,500));
                });
        });        
    };
    return {
        getAllRegistryInfo:getRegistry,
        getRegistryValue:getRegistryValue,
        writeRegistry:writeRegistry,
        setRegistryExpired:setRegistryExpired,
        isRegistryExpired:isRegistryExpired
    };
};
module.exports=registry();








