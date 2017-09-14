process.env.NODE_ENV = 'test';
var assert = require('assert');
var visionModel = require('../../model/vision/vision.model.ARTServer.js');
var taskModel = require('../../model/task/task.model.ARTServer');
var taskImageDeployment = require('../../model/task/imageDeploy.model.ARTServer');
var projectBlueprintModel = require('../../model/project/projectBlueprint.model.ARTServer');
var projectModel = require('../../model/project/project.model.ARTServer');
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

let SettingKit=function(){
    let Mtell_Template_Creator=function(){
        return new Promise((resolve,reject)=>{
            let visionObj=visionSupport.sampleMtell;
            let blueprintMediaDetectionObj=projectSupport.sampleBP_MtellMediaDetection;
            let blueprintMediaPreparationObj=projectSupport.sampleMtellDeployment;
            taskSupport.PostTask(taskSupport.taskMediaDetection)
                .then(()=>{
                    return taskSupport.PostTask(taskSupport.sampleDeployStandardVHDImage);
                })
                .then(()=>{
                    return taskSupport.PostTask(taskSupport.sampleUninstallProduct);
                })
                .then(()=>{
                    return taskSupport.PostTask(taskSupport.sampleRestart);
                })
                .then(()=>{
                    return taskSupport.PostTask(taskSupport.sampleWait);
                })            
                .then(()=>{
                    return taskSupport.PostTask(taskSupport.sampleShutdown);
                })
                .then(()=>{
                    return taskSupport.PostTask(taskSupport.sampleInstallMedia);
                })
                .then(()=>{
                    return taskSupport.PostTask(taskSupport.sampleVHDCheckin);
                })
                .then(()=>{
                    return projectSupport.PostNewBlueprint(blueprintMediaDetectionObj);
                })
                .then(()=>{
                    return projectSupport.PostNewBlueprint(blueprintMediaPreparationObj);
                })            
                .then(()=>{
                    return visionSupport.postNewVision(visionObj);
                })
                .then(()=>{
                    //add machine MVF1 into server
                    return dormSupport.PostDorm(dormSupport.MVF1);
                })
                .then(()=>{
                    //update machien ask for media detection
                    return visionSupport.putBlueprintMachineInstance(visionObj.name, blueprintMediaDetectionObj.name, dormSupport.MVF1.name, 1);
                })
                .then(()=>{
                    //update machine ask for media deployment
                    return visionSupport.putBlueprintMachineInstance(visionObj.name, blueprintMediaPreparationObj.name, dormSupport.MVF1.name, 1,[{vid:'mvt2-mtell-1'}]);
                })
                .then(()=>{
                    //update the project sequence execute deployment after media detection
                    return visionSupport.putNextBlueprint(visionObj.name,blueprintMediaDetectionObj.name,blueprintMediaPreparationObj.name);                    
                })
                .then(()=>{
                    return visionSupport.putNextBlueprint(visionObj.name,blueprintMediaDetectionObj.name,blueprintMediaDetectionObj.name);                    
                })
                .then(()=>{                
                    //initialize media detection project
                    return scheduleSupport.postScheduleFromBlueprint(visionObj.name,blueprintMediaDetectionObj.name);
                })
                .then(()=>{
                    //schedule project into machine
                    return scheduleSupport.postScheduleSignal(visionObj.name);
                })
                .then(()=>{
                    //setting for the media detection
                    return new Promise((resolve)=>{
                        //add template setting for task Media_Detection
                        registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaDetectionObj.name,taskSupport.taskMediaDetection.name,'family','mtell')
                            .then(()=>{
                                //registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaDetectionObj.name,taskSupport.taskMediaDetection.name,'media_path','\\\\hqfiler\\upload$\\aspenONEV10.0\\APM')
                                return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaDetectionObj.name,taskSupport.taskMediaDetection.name,'media_path','\\\\hqfiler\\upload$\\aspenONEV10.0_CP\\Mtell');
                            })
                            .then(()=>{
                                return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaDetectionObj.name,taskSupport.taskMediaDetection.name,'Media_Folder_Snapshot','Run');
                            })
                            .then(()=>{
                                return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaDetectionObj.name,taskSupport.taskMediaDetection.name,'schedule_mode','EveryNewMedia');
                            })
                            .then(()=>{
                                return registrySupport.postRegistry(visionObj.name,registrySupport.Keys.Template,taskSupport.taskMediaDetection.name,'current_schedule',' ');
                            })                        
                            .then(()=>{
                                resolve();
                            });
                    });
                })
                .then(()=>{
                    //setting for the uninstall media
                    return new Promise((resolve)=>{
                        registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaPreparationObj.name,taskSupport.sampleUninstallProduct.name,'Product_Uninstall_List',JSON.stringify(['all','all']))
                            .then(()=>{
                                resolve();
                            });
                    });
                })
                .then(()=>{
                    //setting for the vm deployment
                    return new Promise((resolve)=>{
                        registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaPreparationObj.name,taskSupport.sampleDeployStandardVHDImage.name,'base_vhd_path','599c85c9a758ba2afcc18df9')
                            .then(()=>{
                                return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaPreparationObj.name,taskSupport.sampleDeployStandardVHDImage.name,'memory_size',6*1024*1024*1024);
                            })
                            .then(()=>{
                                return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaPreparationObj.name,taskSupport.sampleDeployStandardVHDImage.name,'cpu_cores',4);
                            })
                            .then(()=>{
                                return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaPreparationObj.name,taskSupport.sampleDeployStandardVHDImage.name,'VM_Username','administrator');
                            })
                            .then(()=>{
                                return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaPreparationObj.name,taskSupport.sampleDeployStandardVHDImage.name,'VM_Pass','Aspen100');
                            })                        
                            .then(()=>{
                                resolve();
                            });
                    });
                })
                .then(()=>{
                    //setting for install media
                    return new Promise((resolve)=>{
                        registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaPreparationObj.name,taskSupport.sampleInstallMedia.name,'Installation_File','\\\\hqfiler\\upload$\\aspenONEV10.0\\APM\\V10.0_APM_Suite_174.iso')
                            .then(()=>{
                                return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaPreparationObj.name,taskSupport.sampleInstallMedia.name,'PRODUCT_LIST','/Aspen Mtell;/Aspen Mtell/Aspen Mtell Suite;/Aspen Mtell/Aspen Mtell Suite/Core Applications and Services (64bit);/Aspen Mtell/Aspen Mtell Suite/Desktop Applications (64bit);/Aspen Mtell/Aspen Mtell Suite/Agent Service (64bit);/Aspen Mtell/Aspen Mtell Suite/Training Service (64bit);/Aspen Mtell/Aspen Mtell SCADA?HMI Integration;/Aspen Mtell/Aspen Mtell SCADA?HMI Integration/HMI Maintenance Gateway (64bit);/Aspen Mtell/Aspen Mtell SCADA?HMI Integration/HMI Maintenance Gateway (32bit);/Aspen Mtell/Aspen Mtell SCADA?HMI Integration/Gateway Server (32bit);/Aspen Mtell/Aspen Mtell EAM Adapters;/Aspen Mtell/Aspen Mtell EAM Adapters/Avantis EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Cityworks EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Empac EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Hansen EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Infor EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Oracle JD Edwards EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Mainsaver EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Maintenance Connection EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/IBM Maximo EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/MP2 EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Tabware EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters;/Aspen Mtell/Aspen Mtell Sensor Adapters/Honeywell PHD Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters/OpenTSDB Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters/OSIsoft PI Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters/Aptitude Observer Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Log Manager;/Aspen Mtell/Aspen Mtell Log Manager/Log Manager (64bit)');
                            })
                            .then(()=>{
                                return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaPreparationObj.name,taskSupport.sampleInstallMedia.name,'Product_Folder_In_Installation_Package','aspenONE_V*_APM');
                            })
                            .then(()=>{
                                let Product_Verification=['mtell','mtell'];
                                let dataJson=JSON.stringify(Product_Verification);
                                return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaPreparationObj.name,taskSupport.sampleInstallMedia.name,'Product_Verification',dataJson);
                            })
                            .then(()=>{
                                resolve();
                            });
                    });
                  
                })
                .then(()=>{
                    //setting for the vhd checkin
                    return new Promise((resolve)=>{
                        registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaPreparationObj.name,taskSupport.sampleVHDCheckin.name,'vhd_serie','2016 MTELL V10.0.3 VHD')
                            .then(()=>{
                                resolve();
                            });
                    });
                })
                .then(()=>{
                    resolve();
                })
                .catch(err=>{
                    reject(err);
                })
        })
    };
    let Mtell_Media_Deployer=function(){
        projectSupport.PostNewBlueprint(projectSupport.sampleMtellDeployment)
            .then(()=>{
                return visionSupport.postNewVision(visionSupport.sampleMtellDeployment);
            })
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.MVF1);
            })
            .then(()=>{
                //add machine MVF1 into server
                return dormSupport.PostDorm(dormSupport.MVF2);
            })
            .then(()=>{
                return visionSupport.putBlueprintMachineInstance(visionSupport.sampleMtellDeployment.name, projectSupport.sampleMtellDeployment.name, dormSupport.MVF2.name, 1,[{vid:'mvt2-mtell-2'}]);
            })
    }
    return {
        Mtell_Template_Creator:Mtell_Template_Creator,
        Mtell_Media_Deployer:Mtell_Media_Deployer
    };
}

describe('Add new vision APM Prestaging',()=>{
    before((done) => {
        taskModel.remove({}, () => {
            taskImageDeployment.remove({}, () => {

                projectBlueprintModel.remove({}, () => {
                    projectModel.remove({}).exec(() => {
                        visionModel.remove({}).exec(() => {
                            dormModel.remove({}).exec(() => {
                                done();
                            });

                        });

                    });
                });

            });

        });

    }); 
    it('shall Add APM prestaging into the project',done=>{
        SettingKit().Mtell_Template_Creator()
            .then(()=>{
                done();
            })
            .catch((err)=>{
                
                assert(false,err);
                done();
            });

    });       
});