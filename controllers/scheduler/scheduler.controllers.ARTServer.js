var visionModel = require('../../model/vision/vision.model.ARTServer');
var projectModel = require('../../model/project/project.model.ARTServer');
var projectControl = require('../project/project.controllers.ARTServer')
let visionControl = require('../vision/vision.controllers.ARTServer')
let projectBlueprintModel = require('../../model/project/projectBlueprint.model.ARTServer')
let blueprintControl = require('../project/projectBlueprint.controllers.ARTServer')
let dormModel = require('../../model/organization/dormModel')
let dormControl = require('../../controllers/organization/dormControl')
let standardError = require('../common/error.controllers.ARTServer')
let lock=require('../common/lock.common.controllers.ARTServer')
let projectStatus=require('../project/status.project.controllers.ARTServer')

const ScheduleBlueprintByLookupMachineDemand=function(visionDoc,blueprint){
   //loop through all machine demands
   let taskList=[];
   //find out specific project schedule
   let schedule=visionDoc.project_schedule.find(item=>{return item.project_blueprint.name==blueprint})


   schedule.machine_demand.forEach(demand=>{
       //one-by-one add machine and its demanded project into current_project
       for(i=0;i<demand.instance;i++){

            
            taskList.push(visionControl.CreateNewProjectAndAddToVision(visionDoc.name,blueprint)
                .then(projectId=>{
                    return projectControl.UpdateHostInProject(projectId.projectId,demand.dorm.name)                
                })
            );
       }
   });
   return Promise.all(taskList);


}






exports.ScheduleBlueprint=function(vision,blueprint){
    //procedure
    //look up project schedule for specific blueprint, if not in there, then return
    //create project based on blueprint schedules
    //Add project to vision
    //atomically schedule each individual project
    //if dorm is scheduled correctly, then change project status to scheduled, otherwise change staus to waiting   
    
    return new Promise((resolve,reject)=>{
        visionControl.IsBlueprintInProjectScheduleValid(vision,blueprint)
            .then(()=>{
                return visionControl.IsBlueprintInProjectScheduleValid(vision,blueprint);
            })
            .then(vision=>{
                return ScheduleBlueprintByLookupMachineDemand(vision,blueprint)
            })
            .then((result)=>{
                resolve();
            })
            .catch(err=>{
                reject(err);
            });
      
    });
}





exports.postScheduleFromBlueprint=function(req,res,next){
    exports.ScheduleBlueprint(req.params.vision,req.params.blueprint)
    .then(()=>{
        res.json();
    })
    .catch((err)=>{
        res.status(err.status).json(err);
    })
}
exports.MarkProjectPendingRetire=function(vision,blueprint){
    //kill project in the vision that is constructed based on blueprint
    return new Promise((resolve,reject)=>{
        //remove all projects that has same blueprint 
        visionControl.getVision({name:vision})
            .then(visionList=>{
                
                if(visionList==null){
                    reject(standardError(`unable to find ${vision}`))
                    return;
                }
                
                if(visionList.length!=1){
                    reject(standardError(`there are ${visionlist.length} visions in the system`),500);
                    return;
                }
                
                projectModel.update({})
                let updates=[];
                visionList[0].current_projects
                    .filter(item=>{
                        return item._project._bluePrint.name==blueprint
                    })
                    .forEach(item=>{
                        updates.push(projectControl.UpdateProjectStatus(item._project._id,projectStatus.pendingRetire.id));                        
                    });

                Promise.all(updates)
                    .then(()=>{
                        resolve()
                    })
                    .catch(err=>{
                        reject(err);
                    });                

            })
            .catch(err=>{
                reject(err);
            })
    })
    



}



exports.ScheduleVision=function(vision){    
    return new Promise((resolve,reject)=>{

        visionControl.getVision({name:vision})
            .then((visionList)=>{
                //if # of vision is invalid ,then return
                if (visionList.length!=1){
                    return;
                }

                let promiseList=[];
                let vision=visionList[0];
                //make sure there is item under current_projects
                if(vision.current_projects!=undefined&&vision.current_projects!=null&&vision.current_projects.length!=0){
                    for(i=0;i<vision.current_projects.length;i++){
                        
                        //for those vision that has been scheduled, just skip them
                        if(vision.current_projects[0]._project.status!=projectStatus.waitingForScheduling.id){
                            continue;
                        }

                        //check the machine status. If current free memory  lower than what current project expect, then just continue
                        if(vision.current_projects[i]._project.host.system_resource.free_memory_mb < vision.current_projects[i]._project._bluePrint.memory_usage_mb)
                        {
                            continue;
                        }
                        //TODO: check the disk usage. if current free disk is lower than what the project expect, then just continue
                        
                        //schedule the task
                        promiseList.push(new Promise((resolve,reject,index=i)=>{
                            projectControl.UpdateProjectStatus(vision.current_projects[index]._project._id.toString(),projectStatus.waitingForRunning.id)
                                .then(()=>{
                                    //add the project into dorm's pending list
                                    return projectControl.AddProjectIntoDormPendingList(vision.current_projects[index]._project._id.toString());
                                })
                                .then(()=>{
                                    resolve();
                                })
                                .catch(err=>{
                                    reject(standardError(err,500));
                                });
                        }));

                    }
                }
                Promise.all(promiseList)
                    .then(()=>{
                        resolve();
                    })
                    .catch(err=>{
                        reject(err);
                    })

            })

    });


}


exports.ScheduleNextProject=function(visionName,projectId){
    return new Promise((resolve,reject)=>{

        visionControl.getVision({name:visionName})
            .then(visionList=>{
                
                if(visionList==null){
                    reject(standardError(`unable to find ${vision}`))
                    return;
                }
                
                if(visionList.length!=1){
                    reject(standardError(`unable to find ${visionName} visions in the system`),500);
                    return;
                }
                //get the valid vision doc
                let visionDoc=visionList[0];
                
                //filter out current_projects to find out if we can find projectName
                let project=visionDoc.current_projects.find(item=>{return item._project._id.toString()==projectId});
                //test project id
                if(project==null){
                    reject(standardError(`unable to find project id specified`,400))
                    
                    resolve();
                    return;
                }
                
                //remove the project from current_project list
                visionDoc.current_projects=visionDoc.current_projects.filter(item=>{return item._project._id.toString()!=projectId});

                //look up the project schedule and schedule next blueprint if any
                let projectBlueprintId=project._project._bluePrint._id.toString();
                
                
                let currentSchedule=visionDoc.project_schedule.find(item=>{return item.project_blueprint._id.toString()==projectBlueprintId});
                //save the vision doc
                visionDoc.save((err)=>{
                    //find current schedule
                    
                    if(currentSchedule.next_project==null){
                        console.warn(`unable to find current blueprint ${projectBlueprintId}`);
                        resolve();
                        return;
                    }

                    ///schedule blueprint
                    let scheduleList=[];
                    currentSchedule.next_project.forEach(item=>{
                        scheduleList.push(exports.ScheduleBlueprint(visionName,item.blueprint.name));
                    });

                    Promise.all(scheduleList)
                        .then(()=>{
                            return exports.ScheduleVision(visionName);
                        })
                        .then(()=>{
                            resolve();
                        })
                        .catch(err=>{
                            reject(standardError(err,500));
                        })


                });




                
                
                
            });

    });
}

exports.postNextProject=function(req,res,next){
    //remove existing project from current project
    //look up project_schedule to find out potential next project
    //if potential next project exist, then schedule it
    exports.ScheduleNextProject(req.params.vision,req.params.project)
        .then(()=>{
            res.status(200).json();
        })
        .catch((err)=>{
            res.status(err.status).json(err);
        })
}


exports.postScheduleSignal=function(req,res,next){
    //schedule all projects in the selected vision
    exports.ScheduleVision(req.params.vision)
        .then(()=>{
            res.status(200).json();
        })
        .catch((err)=>{
            res.status(err.status).json(err);
        })    
}
exports.ScheduleAllPendingTask=function(vision){
    
}
exports.getScheduleByVision=function(req,res,next){
    
}


