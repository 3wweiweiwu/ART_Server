let mediaDetection=require('../task/mediaDetection.task.setup.ARTServer');
let deployVHD=require('../task/vhdDeployment.task.setup.ARTServer');
let uninstallProduct=require('../task/uninstallProduct.task.setup.ARTSErver');
let scheduleSupport=require('../../controllers/scheduler/support.scheduler.controllers.ARTServer');
let installMedia=require('../task/installMedia.task.setup.ARTServer');
let visionSupport = require('../../controllers/vision/support.vision.controllers.ARTServer');
let projectSupport = require('../../controllers/project/support.project.ARTServer');
let dormSupport = require('../../controllers/organization/support.dorm.controller.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');
let vhdCheckin=require('../task/vhdCheckin.task.setup.ARTServer');
//this is the script that we used to setup machine prestaging.
let prestaging=function(){
    let main=function(visionObj,mediaDetectionBlueprint,mediaDetectionSetting,mediaPrestagingBlueprint,vhdDeploymentSetting,mediaInstallSetting,vhdCheckinSetting,dormObj,vid){    
        return new Promise((resolve,reject)=>{
            // visionObj=visionSupport.sampleAPMPrestaging;
            // mediaDetectionBlueprint=projectSupport.sample_APMMediaDetection;
            // mediaDetectionSetting=mediaDetection.constant.apm;
    
            // mediaPrestagingBlueprint=projectSupport.sampleAPMPrestaging;
            // vhdDeploymentSetting=deployVHD.Constant.apm.prestaging;
    
            // mediaInstallSetting=installMedia.Constant.APM;
            // vhdCheckinSetting=vhdCheckin.Constant.apmv101;
            mediaDetection.updateSetting(visionObj.name,mediaDetectionBlueprint.name,mediaDetectionSetting)
                .then(()=>{
                    return uninstallProduct.updateSetting(mediaPrestagingBlueprint.name,uninstallProduct.Constant.uninstallAll);
                })
                .then(()=>{
                    return deployVHD.updateSetting(visionObj.name,mediaPrestagingBlueprint.name,vhdDeploymentSetting);                
                })
                .then(()=>{
                    return taskSupport.PostTaskWithCheck(taskSupport.sampleUninstallProduct);
                })
                .then(()=>{
                    return taskSupport.PostTaskWithCheck(taskSupport.sampleRestart);
                })
                .then(()=>{
                    return taskSupport.PostTaskWithCheck(taskSupport.sampleWait);
                })
                .then(()=>{
                    return taskSupport.PostTaskWithCheck(taskSupport.sampleShutdown);
                })
                .then(()=>{
                    return taskSupport.PostTaskWithCheck(taskSupport.sampleInstallPatch);
                })
                .then(()=>{
                    return installMedia.updateSetting(mediaPrestagingBlueprint.name,mediaInstallSetting);
                })
                .then(()=>{
                    return vhdCheckin.updateSetting(mediaPrestagingBlueprint.name,vhdCheckinSetting);
                })
                .then(()=>{
                    return projectSupport.PostNewBlueprintWithCheck(mediaDetectionBlueprint);
                })
                .then(()=>{
                    return projectSupport.PostNewBlueprintWithCheck(mediaPrestagingBlueprint);
                })
                .then(()=>{
                    return visionSupport.postNewVision(visionObj);
                })
                .then(()=>{
                    return dormSupport.PostDorm(dormObj);
                })
                .then(()=>{
                    //update machien ask for media detection
                    return visionSupport.putBlueprintMachineInstance(visionObj.name, mediaDetectionBlueprint.name, dormObj.name, 1);
                })
                .then(()=>{
                    //update machine ask for media deployment
                    return visionSupport.putBlueprintMachineInstance(visionObj.name, mediaPrestagingBlueprint.name, dormObj.name, 1,[{vid:vid}]);
                })
                .then(()=>{
                    //update the project sequence execute deployment after media detection
                    return visionSupport.putNextBlueprint(visionObj.name,mediaDetectionBlueprint.name,mediaPrestagingBlueprint.name);                    
                })
                .then(()=>{
                    return visionSupport.putNextBlueprint(visionObj.name,mediaDetectionBlueprint.name,mediaDetectionBlueprint.name);                    
                })
                .then(()=>{                
                    //initialize media detection project
                    return scheduleSupport.postScheduleFromBlueprint(visionObj.name,mediaDetectionBlueprint.name);
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
                });
        });
    
        
    };    
    return {configure:main};
};

module.exports=prestaging();