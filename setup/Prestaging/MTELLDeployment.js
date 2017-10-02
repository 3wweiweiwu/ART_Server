process.env.NODE_ENV = 'test';
var assert = require('assert');
var visionModel = require('../../model/vision/vision.model.ARTServer.js');
var taskModel = require('../../model/task/task.model.ARTServer');
var taskImageDeployment = require('../../model/task/imageDeploy.model.ARTServer');
var projectBlueprintModel = require('../../model/project/projectBlueprint.model.ARTServer');
var projectModel = require('../../model/project/project.model.ARTServer');
let vhdSupport=require('../../controllers/shelf/support.vhd.shelf.controllers.ARTServer');
//let projectStatus=require('../../controllers/project/status.project.controllers.ARTServer');
let dormSupport = require('../../controllers/organization/support.dorm.controller.ARTServer');
let dormModel = require('../../model/organization/dormModel');
//let scheduleControl=require('../../controllers/scheduler/scheduler.controllers.ARTServer');
let scheduleSupport=require('../../controllers/scheduler/support.scheduler.controllers.ARTServer');
//var visionControl = require('../../controllers/vision/vision.controllers.ARTServer')
let projectSupport = require('../../controllers/project/support.project.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');
let chai = require('chai');
let chaiHttp = require('chai-http');

let visionSupport = require('../../controllers/vision/support.vision.controllers.ARTServer');
chai.use(chaiHttp);

var registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer');
describe('Add new vision APM Prestaging.',()=>{

    it('shall Add APM prestaging into the project',done=>{
        let visionObj=visionSupport.sampleMtellDeployment;
        let blueprintVHDDetection=projectSupport.sampleMTELLVHDDetection;
        let blueprintVHDDeployment=projectSupport.sampleMtellVHDDeployment;
        let dormObj=dormSupport.qe_mtell_01;
        //let blueprintMediaPreparationObj=projectSupport.sampleMtellDeployment;        
        taskSupport.PostTask(taskSupport.sampleVHDDetection)        
            .then(()=>{
                return projectSupport.PostNewBlueprint(blueprintVHDDetection);
            })
            .then(()=>{
                return projectSupport.PostNewBlueprint(blueprintVHDDeployment);
            })            
            .then(()=>{
                return visionSupport.postNewVision(visionObj);
            })
            .then(()=>{
                return visionSupport.putBlueprintMachineInstance(visionObj.name, blueprintVHDDetection.name, dormObj.name, 1);                
            })            
            .then(()=>{
                return visionSupport.putBlueprintMachineInstance(visionObj.name, blueprintVHDDeployment.name, dormObj.name, 1,[{vid:'mvt2-mtell-d1'},{vid:'mvt2-mtell-d2'}]);                
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
                //add setting for vhd detection
                return new Promise(resolve=>{
                    registrySupport.postRegistry(registrySupport.Keys.Template,blueprintVHDDetection.name,taskSupport.sampleVHDDetection.name,'series','2016 MTELL V10.0.3 VHD')
                        .then(()=>{
                            resolve();
                        });
                });
                
            })          
            .then(()=>{
                //add setting for vhd deployment
                return new Promise((resolve)=>{
                    registrySupport.postRegistry(registrySupport.Keys.Template,blueprintVHDDeployment.name,taskSupport.sampleDeployStandardVHDImage.name,'base_vhd_path','599c85c9a758ba2afcc18df9')
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintVHDDeployment.name,taskSupport.sampleDeployStandardVHDImage.name,'memory_size',4*1024*1024*1024);
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintVHDDeployment.name,taskSupport.sampleDeployStandardVHDImage.name,'cpu_cores',4);
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintVHDDeployment.name,taskSupport.sampleDeployStandardVHDImage.name,'VM_Username','administrator');
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintVHDDeployment.name,taskSupport.sampleDeployStandardVHDImage.name,'VM_Pass','Aspen100');
                        })                        
                        .then(()=>{
                            resolve();
                        });
                });                
            })
            .then(()=>{
                done();
            })
            .catch(err=>{
                done();
            });

    });       
});