process.env.NODE_ENV = 'test';

var assert = require('assert');
var visionModel = require('../../model/vision/vision.model.ARTServer.js');
var taskModel = require('../../model/task/task.model.ARTServer');
var taskImageDeployment = require('../../model/task/imageDeploy.model.ARTServer');
var projectBlueprintModel = require('../../model/project/projectBlueprint.model.ARTServer')
var projectModel = require('../../model/project/project.model.ARTServer')
let projectStatus=require('../../controllers/project/status.project.controllers.ARTServer');
let dormSupport = require('../../controllers/organization/support.dorm.controller.ARTServer');
let dormModel = require('../../model/organization/dormModel')
let scheduleControl=require('../../controllers/scheduler/scheduler.controllers.ARTServer')
let scheduleSupport=require('../../controllers/scheduler/support.scheduler.controllers.ARTServer');
var visionControl = require('../../controllers/vision/vision.controllers.ARTServer');
let projectSupport = require('../../controllers/project/support.project.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');
let chai = require('chai');
var registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer');
let chaiHttp = require('chai-http');
let visionSupport = require('../../controllers/vision/support.vision.controllers.ARTServer');
chai.use(chaiHttp);
//var registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer')
describe('Add required iInstallation information for download and invoke media',()=>{
    // beforeEach((done) => {
    //     taskModel.remove({}, () => {
    //         taskImageDeployment.remove({}, () => {

    //             projectBlueprintModel.remove({}, () => {
    //                 projectModel.remove({}).exec(() => {
    //                     visionModel.remove({}).exec(() => {
    //                         dormModel.remove({}).exec(() => {
    //                             done();
    //                         });

    //                     });

    //                 });
    //             });

    //         });

    //     });

    // }); 
    

    
    it('shall create a project under current project with task and host specified',done=>{
        let visionObj=visionSupport.sampleMtell;
        let blueprintMediaDetectionObj=projectSupport.sampleBP_MtellMediaDetection;
        let blueprintMediaPreparationObj=projectSupport.sampleMtellDeployment;        
        registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaPreparationObj.name,taskSupport.sampleDeployStandardVHDImage.name,'base_vhd_path','599c85c9a758ba2afcc18df9')
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
                        return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaDetectionObj.name,taskSupport.taskMediaDetection.name,'current_schedule',' ');
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
                        resolve();
                    });
            });
        })
        .then(()=>{
            //setting for install media
            return new Promise((resolve)=>{
                registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaPreparationObj.name,taskSupport.sampleInstallMedia.name,'Installation_File','\\\\hqfiler\\upload$\\aspenONEV10.0\\APM\\V10.0_APM_Suite_174.iso')
                    .then(()=>{
                        return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaPreparationObj.name,taskSupport.sampleInstallMedia.name,'VM_Username','administrator');
                    })
                    .then(()=>{
                        return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaPreparationObj.name,taskSupport.sampleInstallMedia.name,'VM_Pass','Aspen100');
                    })                      
                    .then(()=>{
                        return registrySupport.postRegistry(registrySupport.Keys.Template.name,taskSupport.sampleInstallMedia.name,taskSupport.sampleInstallMedia.name,'PRODUCT_LIST','/Aspen Mtell');
                    })
                    .then(()=>{
                        return registrySupport.postRegistry(registrySupport.Keys.Template.name,taskSupport.sampleInstallMedia.name,taskSupport.sampleInstallMedia.name,'Product_Folder_In_Installation_Package','aspenONE_V*_APM');
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
        
    });
});