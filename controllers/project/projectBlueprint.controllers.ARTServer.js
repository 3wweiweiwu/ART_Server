var projectBlueprintModel=require('../../model/project/projectBlueprint.model.ARTServer');
var taskModel=require('../../model/task/task.model.ARTServer.js');
let taskControl=require('../task/task.controllers.ARTServer');
var EventEmitter=require('events');
var async=require('async');
let standardError=require('../common/error.controllers.ARTServer');
class bluePrintClass extends EventEmitter{}



exports.getBlueprints = function (blueprintQuery,cb=()=>{}) {
    return new Promise((resolve,reject)=>{
        //validate baseblueprint and next blueprint to ensure its validation
        projectBlueprintModel            
            .find(blueprintQuery)
            .exec((err,res)=>{
                if(err)
                {
                    reject(err);
                    return cb(err);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
        
    });
};

const getOrCreateBlueprint=function(name){
    //create a new blueprint with name specified
    return new Promise((resolve,reject)=>{
        
        projectBlueprintModel.findOne({name:name})
            .then((blueprint)=>{
                if(blueprint==null){
                    let projectBlueprint=new projectBlueprintModel({
                        name:name
                    });        
                    projectBlueprint.save((err)=>{
                        if(err){
                            reject(standardError(err,500));
                        }
                        else{
                            resolve(projectBlueprint);
                        }            
                    });
                }
                else{
                    resolve(blueprint)
                }
            });
      
    });
}

const updateBlueprint=function(name,note,memory_usage_mb,disk_usage_mb,next,tasks){
    return new Promise((resolve,reject)=>{
        getOrCreateBlueprint(name)
            .then((blueprint)=>{
                //popoulate meta data
                blueprint.note=note;
                blueprint.memory_usage_mb=memory_usage_mb;
                blueprint.disk_usage_mb=disk_usage_mb;
                blueprint.next=next;
                blueprint.tasks=[];

                //popoulate task info
                let taskList=[];
                tasks.forEach(function(taskItem) {
                    taskList.push(taskControl.isTaskValid(taskItem));            
                });
                Promise.all(taskList)
                    .then(taskDocs=>{
                        taskDocs.forEach(task=>{
                            blueprint.tasks.push({task:task._id});
                        });
                        blueprint.save(err=>{
                            if(err){
                                reject(standardError(err,500));
                            }
                            else{
                                resolve();
                            }
                        });
                    })


            })
            .catch(err=>{
                reject(standardError(err,500));
            });

    });
};

const newBlueprint=(req,res,next)=>{
    return new Promise((resolve,reject)=>{
        let projectBlueprint=new projectBlueprintModel({
            name:req.body.name,
            note:req.body.note,
            memory_usage_mb:req.body.memory_usage_mb,
            disk_usage_mb:req.body.disk_usage_mb,
            next:req.body.next
        });
        
        let taskList=[];
        req.body.tasks.forEach(function(taskItem) {
            taskList.push(taskControl.isTaskValid(taskItem));            
        });

        Promise.all(taskList)
            .then(taskDocs=>{
                taskDocs.forEach(task=>{
                    projectBlueprint.tasks.push({task:task._id});
                });
                projectBlueprint.save(err=>{
                    if(err){
                        reject(standardError(err,500));
                    }
                    else{
                        resolve();
                    }
                });
            })
            .catch(err=>{
                reject(standardError(err,500));
            });

    });



};
exports.createBlueprintWithcheck=function(req,res){
    updateBlueprint(req.body.name,req.body.note,req.body.memory_usage_mb,req.body.disk_usage_mb,req.body.next,req.body.tasks)
        .then(()=>{res.json();})
        .catch((err)=>{
            res.status(err.status).json(err);
        });
}

exports.queryBlueprint=function(blueprint,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        projectBlueprintModel.findOne({name:blueprint})
            .exec((err,query)=>{
                if(err){
                    let result={
                        status:500,
                        err:err
                    };
                    reject(result);
                    return cb({result});
                }
                else{
                    resolve(query);
                    return cb(null,query);
                }
            });
    });
};

exports.isBlueprintValid=function(blueprint,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        exports.queryBlueprint(blueprint)
            .then((blueprint)=>{
                if(blueprint==null)
                {
                    reject(standardError('blueprint is invalid',400));
                    return cb(standardError('blueprint is invalid',400));
                }
                else{
                    resolve(blueprint);
                    return cb(null,blueprint);
                }
            })
            .catch(err=>{
                reject(err);
                return cb(err);
            });

    });
};

exports.createBlueprint=(req,res,next)=>{
    projectBlueprintModel.remove({name:req.body.name},(err,query)=>{
        newBlueprint(req,res,next)
            .then(()=>{res.json();})
            .catch((err)=>{
                res.status(400).json({
                    result:'fail',
                    detail:err
                });
            });
    });
};

exports.getBlueprint=(req,res,next,query)=>{
    projectBlueprintModel.find(query)
        .exec((err,query)=>{
            res.json(query);
        });
};
