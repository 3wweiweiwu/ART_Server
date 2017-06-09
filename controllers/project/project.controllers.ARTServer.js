var projectModel=require('../../model/project/project.model.ARTServer');
var projectBlueprintModel=require('../../model/project/projectBlueprint.model.ARTServer');
var projectStatus=require('./status.project.controllers.ARTServer')
let CreateStandardError=require('../common/error.controllers.ARTServer')
exports.CreateNewProject=function(projectBlueprint,cb=()=>{}){
    //create new project based on project blueprint
    return new Promise((resolve,reject)=>{
        projectBlueprintModel
        .findOne({name:projectBlueprint})
        .exec((err,blueprint)=>{
            if(err){
                //if there is error during search process, then return error
                reject(err);
                return cb(err);
            }
            else if(blueprint==null){
                //if we are unable to find blueprint, then return error
                err={
                    result:'error',
                    note:'invalid blueprint name'
                }
                reject(err);
                return cb(err);

            }
            else{                
                //if blueprint is found successfully
                project=new projectModel();
                project._bluePrint=blueprint._id;
                project.pending_tasks=blueprint.tasks;                
                project.status=projectStatus.waitingForScheduling.id;
                project.save((err)=>{
                    if(err)
                    {
                        //if error upon save, then return error
                        reject(err);
                        return cb(err);
                    }
                    else
                    {
                        //return new project id
                        resolve(project._id);
                        return cb(null,project._id);
                    }
                    
                    
                });

            }
        });
    });
    
}

exports.GetProjectById=function(id,cb=()=>{}){
    return new Promise((resolve,reject)=>{

        projectModel
            .findOne({_id:id})
            .populate('_bluePrint')
            .populate('pending_tasks.task')
            .populate('current_task.task')
            .populate('host')        
            .exec((err,project)=>{
                if(err){
                    if(err.name!='CastError'){
                        reject(CreateStandardError(err,500));
                        return cb(CreateStandardError(err,500));
                    }
                    else{
                        //cast error is introduced because it cannot find specified id or the id is invalid
                        reject(CreateStandardError(err,400));
                        return cb(CreateStandardError(err,400));                        
                    }

                }
                else{
                    resolve(project);
                    return cb(null,project);
                }
            });            


    });
}

exports.isProjectValid=function(id){
    return new Promise((resolve,reject)=>{
        exports.GetProjectById(id)
        .then(project=>{
            if(project!=null){
                resolve(project)
            }
            else
            {   reject(CreateStandardError(`project id:{id} is invalid`,400))
                
            }
        })
        .catch(err=>{
            reject(err);
        });
    })
}

exports.GotoNextTaskInProject=function(id){
    return new Promise((resolve,reject)=>{
        projectModel.update(
            {_id:id},
            {$pop:{pending_tasks:-1}},
            {multi:false},
            (err,raw)=>{
                if(err)
                {
                    reject(CreateStandardError(err,500));
                }
                else{
                    resolve(raw);
                }
            });
            
    });
}