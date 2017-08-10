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

describe('add sample apm deployment again',()=>{
    it('shall do a quick test',done=>{
        taskSupport.PostTask(taskSupport.sampleUninstallProduct)
            .then(()=>{
                return projectSupport.PostNewBlueprint(projectSupport.sampleAPMDeployment)
            })    
            .then(()=>{
                done();
            });
    });
});
