process.env.NODE_ENV = 'test';
let vhdSupport=require('../../controllers/shelf/support.vhd.shelf.controllers.ARTServer');
let dormSupport = require('../../controllers/organization/support.dorm.controller.ARTServer');
let vhdDeployment=require('../task/vhdDeployment.task.setup.ARTServer');
let scheduleSupport=require('../../controllers/scheduler/support.scheduler.controllers.ARTServer');
let projectSupport = require('../../controllers/project/support.project.ARTServer');
let vhdDetection=require('../task/vhdDetection.task.setup.ARTServer');
let visionSupport = require('../../controllers/vision/support.vision.controllers.ARTServer');
let assert=require('assert');



describe('Add new vision APM Prestaging.',()=>{

    it('shall Add APM prestaging into the project',done=>{
        let visionObj=visionSupport.sampleMtellDeployment;
        let blueprintVHDDetection=projectSupport.sampleMTELLVHDDetection;
        let blueprintVHDDeployment=projectSupport.sampleMtellVHDDeployment;
        let dormObj=dormSupport.qe_mtell_01;
        //let blueprintMediaPreparationObj=projectSupport.sampleMtellDeployment;        
        vhdDeployment.updateSetting(visionObj.name,blueprintVHDDeployment.name,vhdDeployment.Constant.mtellVHDDeployment)
            .then(()=>{
                return vhdDetection.updateSetting(blueprintVHDDetection.name,vhdDetection.Constant.mtellDetection);
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
                return visionSupport.putBlueprintMachineInstance(visionObj.name, blueprintVHDDetection.name, dormObj.name, 1);                
            })            
            .then(()=>{
                return visionSupport.putBlueprintMachineInstance(visionObj.name, blueprintVHDDeployment.name, dormObj.name, 1,[{vid:'mvt2-mtell-d3'},{vid:'mvt2-mtell-d4'}]);                
            })
            .then(()=>{
                return vhdSupport.postSeries(vhdSupport.Constant.Mtell_V1001_Win16);
            })
            .then(()=>{
            //add vision into watch list for the mtell prestaging
                return vhdSupport.addSeriesSubscriber(vhdSupport.Constant.Mtell_V1001_Win16,visionObj.name);
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
                done();
            })
            .catch(err=>{
                assert(false,err);
                done();
            });

    });       
});