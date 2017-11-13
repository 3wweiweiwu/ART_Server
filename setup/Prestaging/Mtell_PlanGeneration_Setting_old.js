process.env.NODE_ENV = 'test';





let vhdDeployment=require('../task/vhdDeployment.task.setup.ARTServer');
let vhdSupport=require('../../controllers/shelf/support.vhd.shelf.controllers.ARTServer');

let dormSupport = require('../../controllers/organization/support.dorm.controller.ARTServer');


let scheduleSupport=require('../../controllers/scheduler/support.scheduler.controllers.ARTServer');

let projectSupport = require('../../controllers/project/support.project.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');
let resumeSetup=require('../task/resume.task.setup.ARTServer');
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
        
        let dormObj=dormSupport.qe_mtell_01;
        //let blueprintMediaPreparationObj=projectSupport.sampleMtellDeployment;        
        registrySupport.postRegistry(registrySupport.Keys.Template,registrySupport.Keys.Template,registrySupport.Keys.Template,'test','test')
            .then(()=>{
                return vhdDeployment.updateSetting(blueprintMVT.name,vhdDeployment.Constant.mtellMVTDeployment);
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
                            return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,registrySupport.Keys.Template,'P4_Password','Changethis19');
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
                            return taskSupport.PostTaskWithCheck(taskSupport.samplePlanGeneration);
                        })
                        .then(()=>{
                            resolve();
                        });
                });
            
            })          
            .then(()=>{
                //update setting for the mtell resume
                return resumeSetup.updateSetting(blueprintMVT.name,resumeSetup.Constant.mtellSetting);
            })        
            .then(()=>{
                return dormSupport.PostDorm(dormObj);
            })
            .then(()=>{
                //post blueprint
                return projectSupport.PostNewBlueprintWithCheck(blueprintMVT);
            })
            .then(()=>{
            //post new vision and link blueprint to vision
                return new Promise(resolve=>{
                    visionSupport.postVisionWithCheck(visionObj)
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