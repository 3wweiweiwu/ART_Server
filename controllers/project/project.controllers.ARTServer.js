var projectModel=require('../../model/project/project.model.ARTServer');
var projectBlueprintModel=require('../../model/project/projectBlueprint.model.ARTServer');
var projectStatus=require('./status.project.controllers.ARTServer')
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
                project.current_task=null;
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
        .exec((err,project)=>{
            if(err){
                reject(err);
                return cb(err);
            }
            else{
                resolve(project);
                return cb(null,project);
            }
        });

    });
}