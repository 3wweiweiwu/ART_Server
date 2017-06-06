var visionModel=require('../../model/vision/vision.model.ARTServer');
var projectModel=require('../../model/project/project.model.ARTServer');
var projectControl=require('../project/project.controllers.ARTServer')
let projectBlueprintModel=require('../../model/project/projectBlueprint.model.ARTServer')
let blueprintControl=require('../project/projectBlueprint.controllers.ARTServer')
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
                status:req.body.status,
                project_schedule:[]
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
        .populate({
            path:'key_projects'
        })
        .populate({path:'current_projects'})
        .populate({path:'project_schedule.project_blueprint'})
        .populate({path:'project_schedule.machine_demand.dorm'})        
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

const initializeProject=function(vision,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        
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


exports.CreateNewBlueprintSchedule=function(visions,blueprintName,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        //validate blueprint status
        
        blueprintControl.queryBlueprint(blueprintName)
        .then(blueprint=>{
            //if blueprint is not found, then return error
            if(blueprint==null){
                let result={
                    status:400,
                    err:'unable to find blueprint specified'
                };
                reject(result)
                return cb(result);
            }        
            
            //find out schedule for specific blueprint
            vision=visions[0];
            let result=vision.project_schedule.find(schedule=>{return schedule.name===req.params.blueprint});
            if(result==null){
                schedule={
                    project_blueprint:blueprint._id,
                    server_ask:1,
                    machine_demand:[]
                }
                vision.project_schedule.push(schedule);
                vision.save((err)=>{
                    if(err){
                        let result={
                            status:500,
                            err:err
                        };
                        reject(result);
                        return result

                    }
                    else{
                        resolve();
                        return cb(null)
                    }
                    
                })
            }
            else{
                //if there is existing project schedule, then simply return
                resolve();
                return cb(null)
            }
            
        });



    });
}
exports.PutBlueprint=function(req,res,next){
    
    checkVisionNameValid(req.params.vision_name)    
    .then((vision)=>{
        return exports.CreateNewBlueprintSchedule(vision,req.params.blueprint);
    })
    .then(()=>{
        res.json();
    })
    .catch(err=>{res.status(err.status).json(err);});
}
exports.UpdateServerAsk=function(vision,blueprint,serverAsk,cb=()=>{}){
    return new Promise((resolve,reject)=>{

        visionModel.findOne({
            name:vision            
        })
        .populate('project_schedule.project_blueprint')
        .populate('machine_demand.dorm')
        .exec((err,vision)=>{
            if(err){
                
                reject(CreateVisionError(err,500));
                return cb(CreateVisionError(err,500));
            }
            else if(vision==null){

            }
            else
            {
                //update server ask for specific schedule
                let scheduleIndex=vision.project_schedule.findIndex(schedule=>{return schedule.project_blueprint.name===blueprint});
                vision.project_schedule[scheduleIndex].server_ask=serverAsk;
                vision.save((err)=>{
                    if(err)
                    {
                        
                        reject(CreateVisionError(err,500));
                        return cb(CreateVisionError(err,500));
                    }
                    else{
                        resolve();
                        return cb();
                    }
                });

            }
        });
        
    });

}
exports.putBlueprintServerAsk=function(req,res,next){
    //vision check
    checkVisionNameValid(req.params.vision_name)    
    .then((vision)=>{
        //initialize schedule
        return exports.CreateNewBlueprintSchedule(vision,req.params.blueprint);
    })
    .then(()=>{
        //update server ask
        return exports.UpdateServerAsk(req.params.vision_name,req.params.blueprint,req.params.ask)
    })
    .then(()=>{
        //return succss indicator
        res.json();
    })
    .catch(err=>{res.status(err.status).json(err);});
}
const CreateVisionError=function(err,statusCode=400,res={}){
    return{
        result:err,
        status:statusCode,
        err:err,
        res:res

    }
}
