process.env.NODE_ENV = 'test';
var assert = require('assert');
var visionModel = require('../../model/vision/vision.model.ARTServer.js');
var taskModel = require('../../model/task/task.model.ARTServer');
var taskImageDeployment = require('../../model/task/imageDeploy.model.ARTServer');
var projectBlueprintModel = require('../../model/project/projectBlueprint.model.ARTServer');
var projectModel = require('../../model/project/project.model.ARTServer');
let vhdSupport=require('../../controllers/shelf/support.vhd.shelf.controllers.ARTServer');
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
describe('Add new vision APM Prestaging.',()=>{

    it('shall Add APM prestaging into the project',done=>{
        taskSupport.PostTask(taskSupport.sampleVHDDetection)        
            .then(()=>{
                return projectSupport.PostNewBlueprint(projectSupport.sampleMtellVHDDeployment);
            })        
            .then(()=>{
                return visionSupport.postNewVision(visionSupport.sampleMtellDeployment);
            })
            .then(()=>{
                return visionSupport.putBlueprintMachineInstance(visionSupport.sampleMtellDeployment.name, projectSupport.sampleMtellDeployment.name, dormSupport.MVF1.name, 1,[{vid:'mvt2-mtell-d1'}]);
            })
            .then(()=>{
            //add vision into watch list for the mtell prestaging
                return vhdSupport.addSeriesSubscriber(vhdSupport.Constant.Mtell_V1001_Win16,visionSupport.sampleMtellDeployment.name);
            })
            .then(()=>{
                //update the project sequence execute deployment after media deployment is ready
                return visionSupport.putNextBlueprint(visionSupport.sampleMtellDeployment.name,visionSupport.sampleMtellDeployment.name,visionSupport.sampleMtellDeployment.name);                    
            })
            .then(()=>{
                //add setting for me
            })
            .then(()=>{
                done();
            })
            .catch(err=>{
                console.log(err);
            })

    });       
});