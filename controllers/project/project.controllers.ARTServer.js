var projectModel=require('../../model/project/project.model.ARTServer');
var projectBlueprintModel=require('../../model/project/projectBlueprint.model.ARTServer');
var projectStatus=require('./status.project.controllers.ARTServer')
let CreateStandardError=require('../common/error.controllers.ARTServer')
let dormModel=require('../../model/organization/dormModel')
let dormControl=require('../organization/dormControl')
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
                let project=new projectModel();
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
            {   
                reject(CreateStandardError(`project id:{id} is invalid`,400))                
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

exports.UpdatePIDInProject=function(projectId,processId){
    return new Promise((resolve,reject)=>{
        projectModel.findOne({_id:projectId})
            .then(project=>{
                if(project==null){
                    reject(CreateStandardError(`unable to find ${projectId}`,400));
                }
                else{
                    project.pid=processId;
                    project.save(err=>{
                        resolve();
                    })
                }
            })
            .catch(err=>{
                reject(CreateStandardError(err,500));
            });
    });
}
exports.putPIDToProject=function(req,res,next){
    exports.UpdatePIDInProject(req.params.projectId,req.params.dormId)
        .then(()=>{
            res.status(200).json();
        })
        .catch(err=>{
          res.status(err.status).json(err);
        })
}

exports.UpdateHostAndVIDInProject=function(id,host,vid=""){
    //this function does not validate the existence of the id and host, please valid these 2 field before using it!
    return new Promise((resolve,reject)=>{
        dormModel.findOne({name:host})
            .exec((err,dorm)=>{

                projectModel.update(
                    {_id:id},
                    {$set:{host:dorm._id,vid:vid}},
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

            })

            
    });
}


exports.AddProjectIntoDormPendingList=function(projectId){
    return new Promise(function(resolve,reject){
        //validate if project name is valid
        exports.isProjectValid(projectId)
            .then((projectDoc)=>{
                //validate if host field is unidentified
                if(projectDoc.host!=undefined && projectBlueprintModel.host!=null){
                    reject(CreateStandardError('unable to add a project without host into dorm pending list',500));
                    return;
                }
                else{
                    dormModel.update({_id:projectDoc.host._id.toString()},{$push:{pending_project:{key:projectId}}},(err,res)=>{
                        resolve();
                    })
                        
                }
            })
            .catch(err=>{
                reject(err);
            })

        

    });
}
exports.UpdateProjectStatus=function(projectId,statusId){
    return new Promise((resolve,reject)=>{
        projectModel.update({_id:projectId},{status:statusId},(err,raw)=>{
            if(err){
                reject(CreateStandardError(err,500));
            }
            else{
                resolve();
            }
        })        
    })
}
exports.putProjectStatus=function(req,res,next){
    exports.isProjectValid(req.params.projectId)
        .then(()=>{
            return exports.UpdateProjectStatus(req.params.projectId,req.params.statusId)            
        })
        .then(()=>{
            res.status(200).json();
        })
        .catch((err)=>{
            res.status(err.status).json(err);
        })
}

exports.getProject=function(req,res,next){
    exports.isProjectValid(req.params.projectId)
        .then((projectDoc)=>{
            res.status(200).json(projectDoc);
        })
        .catch((err)=>{
            res.status(err.status).json(err);
        })    
}
