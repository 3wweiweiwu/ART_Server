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
let projectControl=require('../project/project.controllers.ARTServer')

let dormSupport = require('../organization/support.dorm.controller.ARTServer')
let dormModel = require('../../model/organization/dormModel')
let scheduleControl=require('./scheduler.controllers.ARTServer')
let scheduleSupport=require('./support.scheduler.controllers.ARTServer')
var visionControl = require('../vision/vision.controllers.ARTServer')
let projectSupport = require('../../controllers/project/support.project.ARTServer')
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer')
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let visionSupport = require('../vision/support.vision.controllers.ARTServer')
chai.use(chaiHttp);

describe('post /schedule/vision/:vision/blueprint/:blueprint',()=>{
    beforeEach((done) => {
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
    it('shall schedule project to the machines if there is enough resource /schedule/vision/:vision/blueprint/:blueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)            
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                //post dorm
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 2);
            })
            .then(()=>{
                
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate('current_projects._project')
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,'it shall not throw error');
                            done();                            
                        }
                        else{
                            //there shall be 2 projects
                            assert.equal(vision.current_projects.length,2);
                            //2 projects shall have different id
                            assert.notEqual(vision.current_projects[0]._id,vision.current_projects[1]._id)
                            done();
                        }
                    });
            })
            .catch(err=>{
                assert(false,'it shall not throw error');
                done();
            });
    });       
    it('shall return error when blueprint is invalid /schedule/vision/:vision/blueprint/:blueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                //post dorm
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 2);
            })
            .then(()=>{
                
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,'projectSupport.projectAPMPrestaging.name');
            })
            .then(()=>{
                assert(false,'it shall not throw error');
                done();                
            })
            .catch(err=>{
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate('current_projects._project')
                    .exec((errVision,vision)=>{
                        if(errVision){
                            assert(false,'it shall not throw error');
                            done();                            
                        }
                        else{
                            //there shall be 2 projects
                            assert.equal(vision.current_projects.length,0);
                            assert.equal(err.err.status,400);
                            //2 projects shall have different id
                            
                            done();
                        }
                    });

            });
    });   
    it('shall return error when vision is invalid',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                //post dorm
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 2);
            })
            .then(()=>{
                
                return scheduleSupport.postScheduleFromBlueprint('visionSupport.visionAPMChef.name',projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                assert(false,'it shall not throw error');
                done();                
            })
            .catch(err=>{
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate('current_projects._project')
                    .exec((errVision,vision)=>{
                        if(errVision){
                            assert(false,'it shall not throw error');
                            done();                            
                        }
                        else{
                            //there shall be 2 projects
                            assert.equal(vision.current_projects.length,0);
                            assert.equal(err.err.status,400);
                            //2 projects shall have different id
                            
                            done();
                        }
                    });

            });
    });   
});
describe('post KillProjects',()=>{
    beforeEach((done) => {
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
    it('shall kill all project in vision that has the same blueprint name',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(projectSupport.postProjectBlueprintAESPrestaging)                        
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                //post dorm
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 2);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAESPrestaging.name)
            })               
            .then(()=>{
                return scheduleControl.MarkProjectDeleted(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})
                    .then((visionList)=>{
                        let blueprint=projectSupport.projectAPMPrestaging.name;
                        let vision=visionList[0];
                            //there shall be 0 projects
                            assert.equal(vision.current_projects.length,4);
                            vision.current_projects
                                .filter(item=>{
                                    return item._project._bluePrint.name==blueprint
                                })
                                .forEach(item=>{
                                    assert.equal(item._project.status,projectStatus.pendingRetire.id)
                                });
                            vision.current_projects
                                .filter(item=>{
                                    return item._project._bluePrint.name!=blueprint
                                })
                                .forEach(item=>{
                                    assert.equal(item._project.status,projectStatus.waitingForScheduling.id)
                                });
                            done();
                    });

                
            })
            .catch(err=>{
                assert(false,'it shall not throw error');
                done();
            });
    });       
  
});
