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
            .then(vision=>{
                //kill the projects to clean the road
                
            })
            .then(()=>{
                return visionControl.IsBlueprintInProjectScheduleValid(vision,blueprint);
            })
            .then(vision=>{
                return ScheduleBlueprintByLookupMachineDemand(vision,blueprint)
            })
            .then(()=>{
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
exports.MarkProjectDeleted=function(vision,blueprint){
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
    visionControl.getVision({name:vision})
        .then((visionList)=>{
            //if # of vision is invalid ,then return
            if (visionList.length!=1){
                return;
            }

            let vision=visionList[0];
            //make sure there is item under current_projects
            if(vision.current_projects!=undefined&&vision.current_projects!=null&&vision.current_projects.length!=0){
                for(i=0;i<vision.current_projects.length;i++){
                    
                    //for those vision that has been scheduled, just skip them
                    if(vision.current_projects[i].status!=projectStatus.waitingForScheduling){
                        continue;
                    }

                    //if not then check if the machine

                }
            }

        })


}
exports.postScheduleSignal=function(req,res,next){
    
}
exports.ScheduleAllPendingTask=function(vision){
    
}
exports.getScheduleByVision=function(req,res,next){
    
}
