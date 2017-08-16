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
                return taskSupport.PostTask(taskSupport.taskMediaInstallation);
            })            
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDetection);
            })
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDeployment);
            })            
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })            
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return scheduleSupport.postTaskForVM(visionSupport.visionAPMChef.name,dormSupport.dorm1.name,projectSupport.blueprintAPMMediaDeployment.name,taskSupport.taskMediaInstallation.name);
            })
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})
                    .then(visionList=>{
                        let vision=visionList[0];
                        //new project shall be added to the current project list
                        assert(vision.current_projects.length,1);
                        done();
                    });
                

            })
            .catch((err)=>{
                assert(false,`shall not throw error ${err}`);
                done();
            });
        
    });
});