process.env.NODE_ENV = 'test';
let async = require('async');
const EventEmitter = require('events');
let app = require('../../app.js');
var assert = require('assert');
var visionModel = require('../../model/vision/vision.model.ARTServer.js');
var taskModel = require('../../model/task/task.model.ARTServer');
var taskImageDeployment = require('../../model/task/imageDeploy.model.ARTServer');
var projectBlueprintModel = require('../../model/project/projectBlueprint.model.ARTServer')
var projectModel = require('../../model/project/project.model.ARTServer')
let projectStatus=require('../../controllers/project/status.project.controllers.ARTServer');
let dormSupport = require('../../controllers/organization/support.dorm.controller.ARTServer')
let dormModel = require('../../model/organization/dormModel')
let scheduleControl=require('../../controllers/scheduler/scheduler.controllers.ARTServer')
let scheduleSupport=require('../../controllers/scheduler/support.scheduler.controllers.ARTServer')
var visionControl = require('../../controllers/vision/vision.controllers.ARTServer')
let projectSupport = require('../../controllers/project/support.project.ARTServer')
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer')
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let visionSupport = require('../../controllers/vision/support.vision.controllers.ARTServer')
chai.use(chaiHttp);
var registryControl = require('../../controllers/registry/registry.controllers.ARTServer')
var registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer')


describe('Add new vision APM Prestaging',()=>{
    before((done) => {
        taskModel.remove({}, (err) => {
            taskImageDeployment.remove({}, (err) => {

                projectBlueprintModel.remove({}, (err) => {
                    projectModel.remove({}).exec(() => {
                        visionModel.remove({}).exec(() => {
                            dormModel.remove({}).exec(() => {
                                done();
                            })

                        })

                    });
                })

            })

        });

    }); 
    it('shall Add APM prestaging into the project',done=>{
        taskSupport.PostTask(taskSupport.taskMediaDetection)
            .then(()=>{
                return taskSupport.PostTask(taskSupport.taskMediaInstallation)
            })
            .then(()=>{
                return taskSupport.PostTask(taskSupport.taskVMDeployment);
            })
            .then(()=>{
                return taskSupport.PostTask(taskSupport.sampleUninstallProduct);
            })            
            .then(()=>{
                return taskSupport.PostTask(taskSupport.taskDeployStandardVHDImage)
            })
            .then(()=>{
                return projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDetection);
            })
            .then(()=>{
                return projectSupport.PostNewBlueprint(projectSupport.sampleAPMDeployment);
            })            
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                //add machine MVF1 into server
                return dormSupport.PostDorm(dormSupport.MVF1);
            })
            .then(()=>{
                //update machien ask for media detection
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, dormSupport.MVF1.name, 1);
            })
            .then(()=>{
                //update machine ask for media deployment
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.sampleAPMDeployment.name, dormSupport.MVF1.name, 1,[{vid:'mvt-1'}]);
            })
            .then(()=>{
                //update the project sequence execute deployment after media detection
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name,projectSupport.sampleAPMDeployment.name)                    
            })
            .then(()=>{
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name,projectSupport.blueprintAPMMediaDetection.name)                    
            })
            .then(()=>{                
                //initialize media detection project
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name);
            })
            .then(()=>{
                //schedule project into machine
                return scheduleSupport.postScheduleSignal(visionSupport.visionAPMChef.name);
            })
            .then(()=>{
                //setting for the media detection
                return new Promise((resolve,reject)=>{
                    //add template setting for task Media_Detection
                    registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.blueprintAPMMediaDetection.name,taskSupport.taskMediaDetection.name,'family','analytics')
                        .then(()=>{
                            //registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.blueprintAPMMediaDetection.name,taskSupport.taskMediaDetection.name,'media_path','\\\\hqfiler\\upload$\\aspenONEV10.0\\APM')
                            return registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.blueprintAPMMediaDetection.name,taskSupport.taskMediaDetection.name,'media_path','e:\\temp\\')
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.blueprintAPMMediaDetection.name,taskSupport.taskMediaDetection.name,'Media_Folder_Snapshot','Run')
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.blueprintAPMMediaDetection.name,taskSupport.taskMediaDetection.name,'schedule_mode','EveryNewMedia')
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.blueprintAPMMediaDetection.name,taskSupport.taskMediaDetection.name,'current_schedule',' ')
                        })                        
                        .then(()=>{
                            resolve();
                        })
                })
            })
            .then(()=>{
                //setting for the uninstall media
                return new Promise((resolve,reject)=>{
                    registrySupport.postRegistry(visionSupport.visionAPMChef.name,projectSupport.sampleUninstallProduct.name,taskSupport.sampleUninstallProduct.name,'Product_Uninstall_List',JSON.stringify(['all','all']))
                })
            })
            .then(()=>{
                //setting for the vm deployment
                return new Promise((resolve,reject)=>{
                    registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.sampleAPMDeployment.name,taskSupport.taskVMDeployment.name,'base_vhd_path','\\\\wuwei1\\temp\\en_w2k16_dc_r2_x64_127gb.vhd')
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.sampleAPMDeployment.name,taskSupport.taskVMDeployment.name,'memory_size',6*1024*1024*1024)
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.sampleAPMDeployment.name,taskSupport.taskVMDeployment.name,'cpu_cores',4)
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.sampleAPMDeployment.name,taskSupport.taskVMDeployment.name,'PRODUCT_LIST',"/Aspen Asset Analytics;/Aspen Fidelis Reliability;/Aspen ProMV;/Aspen Mtell;/Aspen Mtell/Aspen Mtell Suite;/Aspen Mtell/Aspen Mtell Suite/Core Applications and Services (64bit);/Aspen Mtell/Aspen Mtell Suite/Desktop Applications (64bit);/Aspen Mtell/Aspen Mtell Suite/Agent Service (64bit);/Aspen Mtell/Aspen Mtell Suite/Training Service (64bit);/Aspen Mtell/Aspen Mtell Suite/HMI Maintenance Gateway (64bit);/Aspen Mtell/Aspen Mtell Suite/HMI Maintenance Gateway (32bit);/Aspen Mtell/Aspen Mtell Suite/Gateway Server (32bit);/Aspen Mtell/Aspen Mtell EAM Adapters;/Aspen Mtell/Aspen Mtell EAM Adapters/Avantis EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Cityworks EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Empac EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Hansen EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Infor EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Oracle JD Edwards EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Mainsaver EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Maintenance Connection EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/IBM Maximo EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/MP2 EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Tabware EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters;/Aspen Mtell/Aspen Mtell Sensor Adapters/Honeywell PHD Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters/OpenTSDB Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters/OSIsoft PI Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters/Aptitude Observer Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Log Manager;/Aspen Mtell/Aspen Mtell Log Manager/Log Manager (64bit)")
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.sampleAPMDeployment.name,taskSupport.taskVMDeployment.name,'Product_Folder_In_Installation_Package',"aspenONE_V10_APM")
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.sampleAPMDeployment.name,taskSupport.taskVMDeployment.name,'VM_Username',"administrator")
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.sampleAPMDeployment.name,taskSupport.taskVMDeployment.name,'VM_Pass',"Aspen100")
                        })
                        .then(()=>{
                            return registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.sampleAPMDeployment.name,taskSupport.taskVMDeployment.name,'sProduct_Verification',"Mtell,Analytics,ProMV")
                        })
                        .then(()=>{
                            resolve();
                        })
                });
            })
            .then(()=>{
                done()
            })
            .catch((err)=>{
                
                assert(false,err)
                done();
            })

    });       
})