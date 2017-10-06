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
        let visionObj=visionSupport.sampleMtellMVT;
        let blueprintMVT=projectSupport.sampleMtellMVT;
        let blueprintVHDDetection=projectSupport.sampleMTELLVHDDetection;
        
        let dormObj=dormSupport.MVF1;
        //let blueprintMediaPreparationObj=projectSupport.sampleMtellDeployment;        
        registrySupport.postRegistry(registrySupport.Keys.Template,registrySupport.Keys.Template,registrySupport.Keys.Template,'test','test')
            .then(()=>{
            //add setting for vhd deployment
                return new Promise((resolve)=>{
                    registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,taskSupport.sampleDeployStandardVHDImage.name,'base_vhd_path','599c85c9a758ba2afcc18df9')
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,taskSupport.sampleDeployStandardVHDImage.name,'memory_size',8*1024*1024*1024);
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,taskSupport.sampleDeployStandardVHDImage.name,'cpu_cores',4);
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,taskSupport.sampleDeployStandardVHDImage.name,'VM_Username','administrator');
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,taskSupport.sampleDeployStandardVHDImage.name,'VM_Pass','Aspen100');
                        })                        
                        .then(()=>{
                            resolve();
                        });
                });                
            })            
            .then(()=>{
            //add setting for plan generation
                return new Promise(resolve=>{
                    let taskName=taskSupport.samplePlanGeneration.name;
                    registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,registrySupport.Keys.Template,'Subtestcase_Detection','yes')
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,registrySupport.Keys.Template,'P4_Project_Support','["//depot/qe/dev/AUTOMATION/MTELL/Mtell_V10.0.3/Mtell/"]');
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,registrySupport.Keys.Template,'P4_Username','wuwei');
                        })  
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,registrySupport.Keys.Template,'P4_Password','Perforce562');
                        })  
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,registrySupport.Keys.Template,'P4_WorkSpaceName','ART');
                        })  
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,registrySupport.Keys.Template,'P4_Server','hqperforce2:1666');
                        })  
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,registrySupport.Keys.Template,'P4_Work_Space_Folder','c:\\p4');
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,taskName,'Record','{\r\n    "id":  "CQ00768180",\r\n    "Headline":  "Smoke test",\r\n    "Product":  "Aspen Supply Chain Management",\r\n    "Area":  "SCM CAPs",\r\n    "Description":  "MTELL Smoke Test Part 1"\r\n}');
                        })
                        .then(()=>{
                            resolve();
                        });
                });
            
            })          
            .then(()=>{
            //add setting for resume
                return new Promise(resolve=>{
                    let taskName=taskSupport.sampleResume.name;
                    registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,taskName,'iSelenium_MultiThreading_Count','1')
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,taskName,'iRestartAfterScripts','15');
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,taskName,'iMaxTrial','1');
                        })  
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,taskName,'iErrTestCasePerPlan','3');
                        })  
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,taskName,'iTimeout','60');
                        })  
                        .then(()=>{
                            resolve();
                        });
                });
            })        
            .then(()=>{
                return taskSupport.PostTask(taskSupport.samplePlanGeneration);
            })        
            .then(()=>{
                return dormSupport.PostDorm(dormObj);
            })
            .then(()=>{
                return taskSupport.PostTask(taskSupport.sampleResume);
            })
            .then(()=>{
                //post blueprint
                return projectSupport.PostNewBlueprint(blueprintMVT);
            })
            .then(()=>{
            //post new vision and link blueprint to vision
                return new Promise(resolve=>{
                    visionSupport.postNewVision(visionObj)
                        .then(()=>{
                            //add vision into watch list for the mtell prestaging
                            return vhdSupport.addSeriesSubscriber(vhdSupport.Constant.Mtell_V1001_Win16,visionObj.name);
                        })
                        .then(()=>{                            
                            return visionSupport.putBlueprintMachineInstance(visionObj.name, blueprintVHDDetection.name, dormObj.name, 1);
                        })
                        .then(()=>{
                            return visionSupport.putBlueprintMachineInstance(visionObj.name, blueprintMVT.name, dormObj.name, 1,[{vid:'mvt2-mtell-m1'}]);
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
                done();
            })
            .catch(err=>{
                done();
            });

    });       
});