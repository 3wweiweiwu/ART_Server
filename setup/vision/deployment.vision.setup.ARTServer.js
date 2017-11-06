let vhdSupport=require('../../controllers/shelf/support.vhd.shelf.controllers.ARTServer');
let dormSupport = require('../../controllers/organization/support.dorm.controller.ARTServer');
let vhdDeployment=require('../task/vhdDeployment.task.setup.ARTServer');
let scheduleSupport=require('../../controllers/scheduler/support.scheduler.controllers.ARTServer');
let projectSupport = require('../../controllers/project/support.project.ARTServer');
let vhdDetection=require('../task/vhdDetection.task.setup.ARTServer');
let visionSupport = require('../../controllers/vision/support.vision.controllers.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');
let visionModel=require('../../model/vision/vision.model.ARTServer');
let deployment=function(){
    let main=function(visionObj,blueprintVHDDetection,blueprintVHDDeployment,vhdDeploymentSetting,vhdDetectionSetting,dormObj,vidList){
        //vhdDeploymentSetting=vhdDeployment.Constant.apm.prestaging;
        //vhdDetectionSetting=vhdDetection.Constant.apm;
        //vidList=[{vid:'mvt2-apm-d1'},{vid:'mvt2-apm-d2'}];
        return new Promise((resolve,reject)=>{            
            visionModel.remove({name:visionObj.name})
                .then((info)=>{
                    return vhdDeployment.updateSetting(visionObj.name,blueprintVHDDeployment.name,vhdDeploymentSetting)         
                })            
                .then(()=>{
                    return vhdDetection.updateSetting(blueprintVHDDetection.name,vhdDetectionSetting);
                })
                .then(()=>{
                    return taskSupport.PostTaskWithCheck(taskSupport.sampleConfigureIP21);
                })                            
                .then(()=>{
                    return projectSupport.PostNewBlueprintWithCheck(blueprintVHDDetection);
                })
                .then(()=>{
                    return projectSupport.PostNewBlueprintWithCheck(blueprintVHDDeployment);
                })
                .then(()=>{
                    return visionSupport.postNewVision(visionObj);
                })
                .then(()=>{
                    return dormSupport.PostDormWithCheck(dormObj);
                })                  
                // .then(()=>{
                //     return dormSupport.RefreshDorm(dormObj.name);
                // })
                .then(()=>{
                    return visionSupport.putBlueprintMachineInstance(visionObj.name, blueprintVHDDetection.name, dormObj.name, 1);                
                })            
                .then(()=>{
                    return visionSupport.putBlueprintMachineInstance(visionObj.name, blueprintVHDDeployment.name, dormObj.name, 1,vidList);                
                })
                .then(()=>{
                    return vhdSupport.postSeries(vhdDetectionSetting.series||vhdDetectionSetting.vhd_serie);
                })  
                .then(()=>{
                //add vision into watch list for the mtell prestaging
                    return vhdSupport.addSeriesSubscriber(vhdDetectionSetting.series||vhdDetectionSetting.vhd_serie,visionObj.name);
                })
                .then(()=>{
                    //update the project sequence execute deployment after media deployment is ready
                    return visionSupport.putNextBlueprint(visionObj.name,blueprintVHDDetection.name,blueprintVHDDetection.name);                    
                })
                .then(()=>{
                    //update the project sequence execute deployment after media deployment is ready
                    return visionSupport.putNextBlueprint(visionObj.name,blueprintVHDDetection.name,blueprintVHDDeployment.name);                    
                })              
                .then(()=>{                
                    //initialize media detection project
                    return scheduleSupport.postScheduleFromBlueprint(visionObj.name,blueprintVHDDetection.name);
                })
                .then(()=>{
                    //schedule project into machine
                    return scheduleSupport.postScheduleSignal(visionObj.name);
                })
                .then(()=>{
                    resolve();
                })
                .catch(err=>{
                    reject(err);
                })
            ;  
        });

    };
    return {
        configure:main
    };
};
module.exports=deployment();