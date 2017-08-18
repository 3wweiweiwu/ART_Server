process.env.NODE_ENV = 'test';

var assert = require('assert');
// var visionModel = require('../../model/vision/vision.model.ARTServer.js');
// var taskModel = require('../../model/task/task.model.ARTServer');
// var taskImageDeployment = require('../../model/task/imageDeploy.model.ARTServer');
// var projectBlueprintModel = require('../../model/project/projectBlueprint.model.ARTServer')
// var projectModel = require('../../model/project/project.model.ARTServer')
// let projectStatus=require('../../controllers/project/status.project.controllers.ARTServer');
let dormSupport = require('../../controllers/organization/support.dorm.controller.ARTServer');
// let dormModel = require('../../model/organization/dormModel')
// let scheduleControl=require('../../controllers/scheduler/scheduler.controllers.ARTServer')
let scheduleSupport=require('../../controllers/scheduler/support.scheduler.controllers.ARTServer');
var visionControl = require('../../controllers/vision/vision.controllers.ARTServer');
let projectSupport = require('../../controllers/project/support.project.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');
let chai = require('chai');
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
                return taskSupport.PostTask(taskSupport.sampleInstallMedia);
            })
            .then(()=>{
                return taskSupport.PostTask(taskSupport.sampleVHDCheckin);
            })
            .then(()=>{
                return projectSupport.PostNewBlueprint(projectSupport.sampleBP_APMMediaDetection);
            })
            .then(()=>{
                return projectSupport.PostNewBlueprint(projectSupport.sampleAPMDeployment);
            })
            .then(()=>{
                done();
            })
            .catch(err=>{
                assert(false,err);
            });
        
    });
});