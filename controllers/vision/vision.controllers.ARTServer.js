var visionModel=require('../../model/vision/vision.model.ARTServer');
var projectModel=require('../../model/project/project.model.ARTServer');
var projectControl=require('../project/project.controllers.ARTServer')
let projectBlueprintModel=require('../../model/project/projectBlueprint.model.ARTServer')

const UpdateBasicVision=function(req,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        visionModel.findOneAndUpdate({name:req.body.name},{
            name:req.body.name,
            note:req.body.note,
            status:req.body.status
        }
        ,{upsert:true,new:true}
        ,(err,res)=>{
            if(err){
                reject(err);
                cb(err,null);
            }
            else{
                resolve(res);
                cb(null,res);
            }
        })
    });
}

const CreateBasicVision=function(req,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        visionModel
        .remove({name:req.body.name})
        .exec((err)=>{
            vision=new visionModel({
                name:req.body.name,
                note:req.body.note,
                key_projects:[],
                current_projects:[],
                history:[],
                registry:[],
                status:req.body.status         
            });
            vision.save((err)=>{
                if(err){
                    reject(err);
                    return cb(err);
                }
                else{
                    resolve();
                    return cb(null);
                }
            });
        });
    });
}
exports.getVision=function(query,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        visionModel
        .find(query)
        .exec((err,res)=>{
            if(err){
                reject(err);
                return cb(err,res);
            }
            else{
                resolve(res);
                return cb(err,res)
            }

        });
    });
}

const isVisionExists=function(visonResult,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        if(visonResult.length==0)
        {
            let errInfo={
                result:'error',
                detail:'invalid argument, fail to find vision name'
            };
            reject(errInfo);
            return cb(errInfo);
        }
        else{
            resolve(visonResult);
            return cb(null,visonResult);
        }
    });
}




exports.get=function(req,res,next,query){
    exports.getVision(query)
    .then((fb)=>{
        res.json(fb);
    })
    .catch((err)=>{
        res.status(500).json(err);
    });
}

exports.create=function(req,res,next){
    CreateBasicVision(req)
    .then((feedback)=>{
        res.json(feedback);
    })
    .catch((err)=>{
        res.status(500).json(err);
    });
}

exports.putProject=function(req,res,next){
    exports.getVision({name:req.params.vision_name})
    .then(isVisionExists(result))
    .then(result=>{
        
    })
    .catch((err)=>{
        res.status(400).json(err);
    });
}
const checkVisionNameValid=function(name,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        query={
            name:name,        
        }
        exports.getVision(query)
        .then((vision)=>{
            if(vision.length==0){
                //if no vision found, then return with error
                err={
                    result:'error',
                    status:400,
                    note:'unable to find vision specified'
                }
                reject(err);
                return cb(err);
            }
            else if(vision.length!=1){
                //if more than 1 vision found, then flag with error
                err={
                    result:'error',
                    status:500,
                    note:'there are more than one vision with the same name'
                }
                reject(err);
                return cb(err);             
            }
            else{
                resolve(vision);
                return cb(null,query);
            }
        })
        
    });
}
exports.PutKeyProject=function(req,res,next){

    checkVisionNameValid(req.params.vision_name)
    .then((vision)=>{
        //if there is only 1 vision found, then validate projectBlueprint
        
        projectBlueprintModel
        .findOne({name:req.params.projectBlueprint})
        .exec((err,blueprint)=>{
            if(err){
                res.status(400).json({
                    result:'error',
                    note:err
                });
            }
            else if(blueprint==null){
                //if no blueprint is found, then return error 400
                res.status(400).json({
                    result:'error',
                    note:'The project blueprint specified is incorrect'
                })
            }
            else{
                //if blueprint is found, then link blueprint with project
                vision[0].key_projects.push(blueprint._id);
                vision[0].save((err)=>{
                    if(err)
                    {
                        //if error is found, then return error
                        rs.status(500).json({
                            result:'error',
                            note:err
                        })
                    }
                    else{
                        res.json({
                            result:'ok'
                        });
                    }

                });
            }

        });
    })
    .catch(err=>{
        res.status(err.status).json(err);
    });

}

exports.PutRegistry=function(req,res,next){
    checkVisionNameValid(req.params.vision_name)
    .then(query=>{
        let queryResult=query[0];
        queryResult.registry=queryResult.registry.filter((item)=>{return item.key!=req.body.key});        
        queryResult.registry.push({
            key:req.body.key,
            value:req.body.value
        });
        queryResult.save((err)=>{
            if(err){
                res.status(500).json(err);
            }
            else
            {
                res.json({result:'ok'});
            }
        })
    })
    .catch(err=>{
        res.status(err.status||500).json(err);
    });
}

exports.GetRegistry=function(req,res,next){
    visionModel.findOne({name:req.params.vision_name,'registry.key':req.params.key})
    .exec((err,vision)=>{
        if(err)
        {
            res.status(500).json(err);
        }
        else if(vision!=null)
        {
            //if there is such a vision
            res.json(vision.registry.filter(value=>{return value.key==req.params.key})[0]);
        }
        else
        {
            res.status(400).json({value:null});
        }
    })
}