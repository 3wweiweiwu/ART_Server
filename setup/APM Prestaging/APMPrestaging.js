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
                taskSupport.PostTask(taskSupport.taskMediaInstallation)
            })            
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDetection);
            })
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDeployment);
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
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDeployment.name, dormSupport.MVF1.name, 1);
            })
            .then(()=>{
                //update the project sequence execute deployment after media detection
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name,projectSupport.blueprintAPMMediaDeployment.name)                    
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
                return new Promise((resolve,reject)=>{
                    //add template setting for task Media_Detection
                    registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.blueprintAPMMediaDetection.name,taskSupport.taskMediaDetection.name,'family','analytics')
                        .then(()=>{
                            registrySupport.postRegistry(registrySupport.Keys.Template,projectSupport.blueprintAPMMediaDetection.name,taskSupport.taskMediaDetection.name,'media_path','\\\\hqfiler\\upload$\\aspenONEV10.0\\APM')
                        })
                        .then(()=>{
                            resolve();
                        })
                })
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