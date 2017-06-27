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

describe('Add new vision APM Prestaging',()=>{

    it('shall Add APM prestaging into the project',done=>{
        taskSupport.postTaskAPMNewMediaDetection()            
            .then(taskSupport.posttaskAPMInstall)
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDetection);
            })
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDeployment);
            })            
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.MVF1);
            })
            .then(()=>{
                //update machien ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, dormSupport.MVF1.name, 1);
            })
            .then(()=>{
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDeployment.name, dormSupport.MVF1.name, 1);
            })
            .then(()=>{                
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name);
            })
            .then(()=>{
                done()
            })
            .catch((err)=>{
                assert(false,'it shall not return error')
            })

    });       
})