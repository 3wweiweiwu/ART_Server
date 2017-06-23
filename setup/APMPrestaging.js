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
let projectStatus=require('../project/status.project.controllers.ARTServer');
let dormSupport = require('../organization/support.dorm.controller.ARTServer')
let dormModel = require('../../model/organization/dormModel')

var visionControl = require('./vision.controllers.ARTServer')
let projectSupport = require('../../controllers/project/support.project.ARTServer')
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer')
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let visionSupport = require('./support.vision.controllers.ARTServer')
chai.use(chaiHttp);