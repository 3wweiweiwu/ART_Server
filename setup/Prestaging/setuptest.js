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
let resumeSetting=require('../task/resume.task.setup.ARTServer');
let planGenerationSetup=require('../task/planGeneration.task.setup.ARTServer');
//var registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer')
describe('Add required iInstallation information for download and invoke media',()=>{
    it('shall create a project under current project with task and host specified',done=>{
        let visionObj=visionSupport.sample_QuickTest;
        let blueprint={
            name:'Test Blueprint',
            note:'Validate Mtell MVT whenever it is posted',
            memory_usage_mb:0*1024,
            disk_usage_mb:10*1024,
            tasks:[taskSupport.sampleResume.name],
            next:[]             
        };        
        visionSupport.postNewVision(visionObj)
            .then(()=>{
                return planGenerationSetup.updateSetting(blueprint,planGenerationSetup.Constant.a1pe);
            })
            .then(()=>{
                return resumeSetting.updateSetting(blueprint.name,resumeSetting.Constant.A1PE);
            })
            .then(()=>{
                return projectSupport.PostNewBlueprint(blueprint);
            })        
            .then(()=>{
                return visionSupport.putBlueprintMachineInstance(visionObj.name, blueprint.name, 'MVT2-A1P-M1', 1);
            })            
            .then(()=>{                
                //initialize media detection project
                return scheduleSupport.postScheduleFromBlueprint(visionObj.name,blueprint.name);
            })
            .then(()=>{
                //schedule project into machine
                return scheduleSupport.postScheduleSignal(visionObj.name);
            })     
            .then(()=>{
                done();
            });
    });
});