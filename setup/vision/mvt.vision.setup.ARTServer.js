let vhdDeployment=require('../task/vhdDeployment.task.setup.ARTServer');
let vhdSupport=require('../../controllers/shelf/support.vhd.shelf.controllers.ARTServer');
let dormSupport = require('../../controllers/organization/support.dorm.controller.ARTServer');
let scheduleSupport=require('../../controllers/scheduler/support.scheduler.controllers.ARTServer');
let projectSupport = require('../../controllers/project/support.project.ARTServer');
let resumeSetup=require('../task/resume.task.setup.ARTServer');
let visionSupport = require('../../controllers/vision/support.vision.controllers.ARTServer');
let planGenerationSetup=require('../task/planGeneration.task.setup.ARTServer');
let vhdDetection=require('../task/vhdDetection.task.setup.ARTServer');
let MVT=function(){
    let configure=function(visionObj,blueprintVHDDetection,vhdDetectionSetting,blueprintVHDDeployment,vhdDeploymentSetting,blueprintMVT,planGenerationSetting,resumeSetting,dormObj,vidList){
        return new Promise((resolve,reject)=>{
            //configure vhd detection
            vhdDetection.updateSetting(blueprintVHDDetection.name,vhdDetectionSetting)
                .then(()=>{
                    return vhdDeployment.updateSetting(visionObj.name,blueprintVHDDeployment.name,vhdDeploymentSetting);
                })
                .then(()=>{
                    return planGenerationSetup.updateSetting(blueprintMVT,planGenerationSetting);
                })
                .then(()=>{
                    return  resumeSetup.updateSetting(blueprintMVT.name,resumeSetting);
                })
                .then(()=>{
                    //post blueprint
                    return projectSupport.PostNewBlueprintWithCheck(blueprintMVT);
                })                
                .then(()=>{
                    return dormSupport.PostDorm(dormObj);
                })                
                .then(()=>{
                //post new vision and link blueprint to vision
                    return new Promise(resolve=>{
                        visionSupport.postVisionWithCheck(visionObj)
                            .then(()=>{
                                //add vision into watch list for the mtell prestaging
                                return vhdSupport.addSeriesSubscriber(vhdDetectionSetting.series,visionObj.name);
                            })
                            .then(()=>{                            
                                return visionSupport.putBlueprintMachineInstance(visionObj.name, blueprintVHDDetection.name, dormObj.name, 1);
                            })
                            .then(()=>{
                                return visionSupport.putBlueprintMachineInstance(visionObj.name, blueprintMVT.name, dormObj.name, 1,vidList);
                            })
                            .then(()=>{
                                //update the project sequence execute deployment after media deployment is ready
                                return visionSupport.putNextBlueprint(visionObj.name,blueprintVHDDetection.name,blueprintVHDDetection.name);                    
                            })
                            .then(()=>{
                                //update the project sequence execute deployment after media deployment is ready
                                return visionSupport.putNextBlueprint(visionObj.name,blueprintVHDDetection.name,blueprintMVT.name);                    
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
                            });
                    });
                })                
                .then(()=>{
                    resolve();
                })
                .catch(err=>{
                    console.log(err);
                    reject(err);
                });
        });
    };
    return {
        configure:configure
    };
};
module.exports=MVT();