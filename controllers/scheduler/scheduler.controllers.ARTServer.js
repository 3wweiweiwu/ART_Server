var visionModel = require('../../model/vision/vision.model.ARTServer');
var projectModel = require('../../model/project/project.model.ARTServer');
var projectControl = require('../project/project.controllers.ARTServer');
let visionControl = require('../vision/vision.controllers.ARTServer');
let projectBlueprintModel = require('../../model/project/projectBlueprint.model.ARTServer');
let blueprintControl = require('../project/projectBlueprint.controllers.ARTServer');
let dormModel = require('../../model/organization/dormModel');
let dormControl = require('../../controllers/organization/dormControl');
let taskControl=require('../../controllers/task/task.controllers.ARTServer');
let standardError = require('../common/error.controllers.ARTServer');
let lock=require('../common/lock.common.controllers.ARTServer');
let projectStatus=require('../project/status.project.controllers.ARTServer');


const IncreaseVMGroupNumberForBlueprint=function(visionDoc,blueprintDoc){
    //increase the current_group_number by 1
    //this function is used to choose which vm group to schedule
    return new Promise((resolve,reject)=>{
        let infoIndex=visionDoc.info.project_schedule.findIndex(item=>{
            return item.vid_group_info.project_blueprint._id.toString()==blueprintDoc._id.toString();
        });
        if(infoIndex==-1){
            //create new group info
            visionDoc.info.project_schedule.push({
                vid_group_info:{
                    project_blueprint:blueprintDoc._id.toString(),
                    current_group_number:1
                }
            });
        }
        else{
            //increase the current_group_number count
            visionDoc.info.project_schedule[infoIndex].vid_group_info.current_group_number++;
        }
        visionDoc.save(err=>{
            if(err){
                //if it is version error, then we are going to redo this operation again with updated document
                if(err.name=='VersionError'){
                    visionControl.getVision({_id:visionDoc._id})
                        .then(visionDoc=>{
                            return IncreaseVMGroupNumberForBlueprint(visionDoc[0],blueprintDoc);
                        })
                        .then(()=>{
                            resolve();
                        })
                        .catch((err)=>{
                            reject(standardError(err));
                            return;
                        });
                }
                else{
                    reject(standardError(err));
                    return;
                }
                
            }
            else{
                resolve();
            }
        });
    });
};
const ScheduleBlueprintByLookupMachineDemand=function(visionDoc,blueprint){
    //loop through all machine demands
    let taskList=[];
    //find out specific project schedule
    let schedule=visionDoc.project_schedule.find(item=>{return item.project_blueprint.name==blueprint;});
    let scheduleInfo=visionDoc.info.project_schedule.find(item=>{return item.vid_group_info.project_blueprint.name==blueprint;});
    let current_group_number=0;
    let scheduled_vids=[];
   
    if(scheduleInfo!=undefined){
        //if we can find schedule info, then get the current group number and decide what to do next
        current_group_number=scheduleInfo.vid_group_info.current_group_number;
    }


    //build a hash table to map group_number and vid relationship
    
    let groupHash={};      
    let vidNumber=0;
    schedule.machine_demand.forEach(demand=>{
        demand.vid_list.forEach(vid=>{
            //if there is no group_number specified, then mark it default group 0
            if(vid.group_number==undefined){
                console.warn(`no group_number specified for ${vid} in ${visionDoc.name}`);
                vidNumber=0;
            }
            else{
                vidNumber=vid.group_number;
            }


            if(groupHash[vidNumber]==undefined){
                groupHash[vidNumber]=[vid.vid];
            }
            else{
                groupHash[vidNumber].push(vid.vid);
            }                

        });
    });  

    let keys=Object.keys(groupHash);
    let currentGroupIndex=current_group_number % keys.length;
    scheduled_vids=groupHash[keys[currentGroupIndex]];


    schedule.machine_demand.forEach(demand=>{
        //one-by-one add machine and its demanded project into current_project
       
        //if current instance number is less than the  number of machine being scheduled for the execution, then spin up all the machine
       
       
        //get number of qualified instance we have for this specific machine
        let qualifiedVidList=demand.vid_list.filter(item=>{
            return scheduled_vids.indexOf(item.vid)>-1;
        });
        if(qualifiedVidList==undefined || qualifiedVidList==null){
            qualifiedVidList=[];
        }
        let instanceNumber=qualifiedVidList.length;
        if(instanceNumber<=demand.instance){
            
            instanceNumber=demand.instance;
        }
        else{
            console.warn(`vision:${visionDoc.name}, blueprint:${blueprint} - current instance # is less than #vm required`);
        }

        for(let i=0;i<instanceNumber;i++){

            //currently, only add vid that is specified in the vid list to the machine
            //TODO: automatically generate vid for those un-assigned vid
            taskList.push(visionControl.CreateNewProjectAndAddToVision(visionDoc.name,blueprint)
                .then(projectId=>{
                    let vidInfo='';
                    if(i<qualifiedVidList.length){
                        vidInfo=qualifiedVidList[i].vid;
                    }
                    return projectControl.UpdateHostAndVIDInProject(projectId.projectId,demand.dorm.name,vidInfo);
                })                
            );
        }
    });

    //increase index of current_grou_number
   
    return Promise.all(taskList);


};






exports.ScheduleBlueprint=function(vision,blueprint){
    //procedure
    //look up project schedule for specific blueprint, if not in there, then return
    //mark all project that is made based on blueprint pending retire
    //create project based on blueprint schedules
    //based on the current group_number info, decide which vm group to schedule
    //Add project to vision
    //atomically schedule each individual project
    //if dorm is scheduled correctly, then change project status to scheduled, otherwise change staus to waiting   
    
    return new Promise((resolve,reject)=>{
        visionControl.IsBlueprintInProjectScheduleValid(vision,blueprint)            
            .then(vision=>{
                
                //mark all project that is made based on blueprint pending retire
                //create project based on blueprint schedules
                
                return ScheduleBlueprintByLookupMachineDemand(vision,blueprint)
                    .then(()=>{
                        return blueprintControl.isBlueprintValid(blueprint);
                    })
                    .then((blueprintDoc)=>{
                        return IncreaseVMGroupNumberForBlueprint(vision,blueprintDoc);
                    });
                    
            })
            .then((result)=>{
                resolve();
            })
            .catch(err=>{
                reject(err);
            });
      
    });
};





exports.postScheduleFromBlueprint=function(req,res,next){
    exports.ScheduleBlueprint(req.params.vision,req.params.blueprint)
        .then(()=>{
            res.json();
        })
        .catch((err)=>{
            res.status(err.status).json(err);
        });
};
exports.MarkProjectPendingRetire=function(vision,blueprint){
    //kill project in the vision that is constructed based on blueprint
    return new Promise((resolve,reject)=>{
        //remove all projects that has same blueprint 
        visionControl.getVision({name:vision})
            .then(visionList=>{
                
                if(visionList==null){
                    reject(standardError(`unable to find ${vision}`));
                    return;
                }
                
                if(visionList.length!=1){
                    reject(standardError(`there are ${visionlist.length} visions in the system`),500);
                    return;
                }
                
                
                let updates=[];
                visionList[0].current_projects
                    .filter(item=>{
                        return item._project._bluePrint.name==blueprint;
                    })
                    .forEach(item=>{
                        updates.push(projectControl.UpdateProjectStatus(item._project._id,projectStatus.pendingRetire.id));                        
                    });

                Promise.all(updates)
                    .then(()=>{
                        resolve();
                    })
                    .catch(err=>{
                        reject(err);
                    });                

            })
            .catch(err=>{
                reject(err);
            });
    });
    



};



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
                    for(let i=0;i<vision.current_projects.length;i++){
                        
                        //for those vision that has been scheduled, just skip them
                        if(vision.current_projects[i]._project.status!=projectStatus.waitingForScheduling.id){
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
                                    //return projectControl.AddProjectIntoDormPendingList(vision.current_projects[index]._project._id.toString());
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
                    });

            });

    });


};


exports.ScheduleNextProject=function(visionName,projectId){
    return new Promise((resolve,reject)=>{

        visionControl.getVision({name:visionName})
            .then(visionList=>{
                
                if(visionList==null){
                    reject(standardError(`unable to find ${vision}`));
                    return;
                }
                
                if(visionList.length!=1){
                    reject(standardError(`unable to find ${visionName} visions in the system`),500);
                    return;
                }
                //get the valid vision doc
                let visionDoc=visionList[0];
                
                //filter out current_projects to find out if we can find projectName
                let project=visionDoc.current_projects.find(item=>{return item._project._id.toString()==projectId;});
                //test project id
                if(project==null){
                    reject(standardError(`unable to find project id ${projectId} specified`,400));
                    return;
                }
                
                
                //if there is pending tasks under project, then go to next task
                if (project._project.pending_tasks.length>=1){
                    projectControl.GotoNextTaskInProject(projectId)
                        .then(()=>{
                            if(project._project.pending_tasks.length>=2){
                                //if there is pending task after removal, then we move on
                                resolve();
                                return;
                            }
                            else{
                                //if there is no pending task after removal, then will run this function again and remove the project
                                return exports.ScheduleNextProject(visionName,projectId)
                                    .then(()=>{
                                        resolve();
                                    });
                            }
                        })
                        .catch(err=>{
                            reject(standardError(err,500));
                            
                        });                    
                    return;                                            
                }


                //if there is no pending task under the task, look up the project schedule and schedule next blueprint if any
                let projectBlueprintId=project._project._bluePrint._id.toString();
                let currentSchedule=visionDoc.project_schedule.find(item=>{return item.project_blueprint._id.toString()==projectBlueprintId;});
                
                //mark current project as pending retire
                projectControl.UpdateProjectStatus(projectId,projectStatus.pendingRetire.id)
                    .then(()=>{
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
                            });
                    });




                
                
                
            });

    });
};

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
        });
};


exports.postScheduleSignal=function(req,res,next){
    //schedule all projects in the selected vision
    exports.ScheduleVision(req.params.vision)
        .then(()=>{
            res.status(200).json();
        })
        .catch((err)=>{
            res.status(err.status).json(err);
        });    
};

exports.GetProjectsInMachine=function(machineName){
    return new Promise((resolve,reject)=>{
        visionModel.find({})
            .populate({
                path:'current_projects._project',
                populate:{
                    path:'host'
                }
            })
            .populate({
                path:'current_projects._project',
                populate:{
                    path:'pending_tasks.task'
                }
            })
            .populate({
                path:'current_projects._project',
                populate:{
                    path:'_bluePrint'
                }
            })            
            .exec((err,visionList)=>{
                //filter through the vision to find out project that is associated with machine
                if(err){
                    reject(standardError(err,500));
                    return;
                }
                let result=[];
                visionList.forEach(vision=>{
                    vision.current_projects.filter(project=>{
                        if(project._project.host==undefined){
                            console.warn(`No host is specified for project ${project._project._bluePrint.name}`);
                            return false;
                        }
                        else{
                            return project._project.host.name==machineName;    
                        }
                        
                    }).forEach(item=>{
                        //clone the object by parsing it to json and then parse it back
                        let jsonItem=JSON.stringify(item);
                        let newItem=JSON.parse(jsonItem);
                        newItem['vision']=vision;
                        result.push(newItem);
                    });
                });
                resolve(result) ;
            });        
    });
        
};
exports.getMachineProject=function(req,res,next){
    //get the projects that associate with specific machine
    dormControl.IsDormValid(req.params.machine)
        .then(()=>{
            return exports.GetProjectsInMachine(req.params.machine);
        })    
        .then((result)=>{
            res.status(200).json({result:result});
        })
        .catch((err)=>{
            res.status(err.status).json(err);
        });      
};
exports.AddTaskForVM=function(dormObj,visionObj,blueprintObj,taskObj){
    return new Promise((resolve,reject)=>{
        if(dormObj==undefined){
            reject(standardError('unable to find dormObj specified',500));
            return;
        }
        if(visionObj==undefined){
            reject(standardError('unable to find visionObj specified',500));
            return;
        }
        if(taskObj==undefined){
            reject(standardError('unable to find taskObj specified',500));
            return;
        }                
        let projectObj=new projectModel({
            pending_tasks:[{task:taskObj._id}],
            _bluePrint:blueprintObj._id,
            host:dormObj._id,
            status:projectStatus.waitingForRunning.id,
            pid:'',
            vid:''
        });
        projectObj.save(err=>{
            if(err){
                reject(standardError(err,500));
                return;
            }
            else{
                //delete other project in current_project with similar vm name
                visionObj.current_projects=visionObj.current_projects.filter(item=>{
                    return item._project.host.name!=dormObj.name;
                });
                
                //add the new project to the current_schedule uner the vision specified
                visionObj.current_projects.push({_project:projectObj._id});
                visionObj.save(err=>{
                    if(err){
                        reject(standardError(err,500));
                        return;
                    }                    
                    else{
                        resolve(projectObj._id);
                    }
                });
                
            }
        });
    });

};
exports.postTaskForVM=function(req,res,next){
    //this function will post task for the VM
    let promiseChain=[];
    promiseChain.push(dormControl.IsDormValid(req.params.vm));
    promiseChain.push(visionControl.getVision({name:req.params.vision}));
    promiseChain.push(taskControl.isTaskValid(req.params.task));
    promiseChain.push(blueprintControl.isBlueprintValid(req.params.blueprint));
    Promise.all(promiseChain)
        .then(results=>{
            //add a project based on the task specified
            let dormObj=results[0];
            let visionObj=results[1][0];            
            let taskObj=results[2];
            let blueprintObj=results[3];
            return exports.AddTaskForVM(dormObj,visionObj,blueprintObj,taskObj);
        })        
        .then(()=>{
            res.status(200).json();
        })
        .catch(err=>{
            res.status(err.status).json(err);
        });
    

    

    
    
};