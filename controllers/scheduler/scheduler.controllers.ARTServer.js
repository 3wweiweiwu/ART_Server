var visionModel = require('../../model/vision/vision.model.ARTServer');
var projectModel = require('../../model/project/project.model.ARTServer');
var projectControl = require('../project/project.controllers.ARTServer')
let visionControl = require('../vision/vision.controllers.ARTServer')
let projectBlueprintModel = require('../../model/project/projectBlueprint.model.ARTServer')
let blueprintControl = require('../project/projectBlueprint.controllers.ARTServer')
let dormModel = require('../../model/organization/dormModel')
let dormControl = require('../../controllers/organization/dormControl')
let standardError = require('../common/error.controllers.ARTServer')


const ScheduleBlueprintByLookupMachineDemand=function(visionDoc,blueprint){
   //loop through all machine demands
   let taskList=[];
   //find out specific project schedule
   schedule=visionDoc.project_schedule.find(item=>{return item.project_blueprint.name==blueprint})


   schedule.machine_demand.forEach(demand=>{
       //one-by-one add machine and its demanded project into current_project
       for(i=0;i<demand.instance;i++){
            // var AddSchedule=visionControl.CreateNewProjectAndAddToVision(visionDoc.name,blueprint)
            
            // var SpecifyHost=AddSchedule.then(projectId=>{
            //     return projectControl.UpdateHostInProject(projectId.projectId,demand.dorm.name)                
            // }) 

            
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

exports.ScheduleVision=function(vision){
    

}
exports.postScheduleSignal=function(req,res,next){
    
}
exports.ScheduleAllPendingTask=function(vision){
    
}
exports.getScheduleByVision=function(req,res,next){
    
}
