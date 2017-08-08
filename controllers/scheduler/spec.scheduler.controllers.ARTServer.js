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
describe('post /schedule/vision/:vision/vm/:vm/task/:task',()=>{
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
    it('shall create a project under current project with task and host specified',done=>{
        taskSupport.PostTask(taskSupport.taskMediaDetection)
            .then(()=>{
                return taskSupport.PostTask(taskSupport.taskMediaInstallation)
            })            
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDetection)
            })
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDeployment)
            })            
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })            
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return scheduleSupport.postTaskForVM(visionSupport.visionAPMChef.name,dormSupport.dorm1.name,taskSupport.taskMediaInstallation.name)
            })
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})
                    .then(visionList=>{
                        let vision=visionList[0];
                        //new project shall be added to the current project list
                        assert(vision.current_projects.length,1);
                        done();
                    })
                

            })
            .catch((err)=>{
                assert(false,'shall not throw error')
                done();
            })
        
    })
    it('shall delete other project in current_project with similar vm name',done=>{
        taskSupport.PostTask(taskSupport.taskMediaDetection)
            .then(()=>{
                return taskSupport.PostTask(taskSupport.taskMediaInstallation)
            })            
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDetection)
            })
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDeployment)
            })            
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })            
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return scheduleSupport.postTaskForVM(visionSupport.visionAPMChef.name,dormSupport.dorm1.name,taskSupport.taskMediaInstallation.name)
                                        .then(()=>{
                                            return scheduleSupport.postTaskForVM(visionSupport.visionAPMChef.name,dormSupport.dorm1.name,taskSupport.taskMediaDetection.name)
                                        })
            })
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})
                    .then(visionList=>{
                        
                        let vision=visionList[0];
                        //new project shall be added to the current project list
                        assert(vision.current_projects.length,1);
                        
                        taskModel.findById(vision.current_projects[0]._project.pending_tasks[0].task.toString())
                            .then((task=>{
                                assert.equal(task.name,taskSupport.taskMediaDetection.name);
                                done();
                            }))
                        
                    })
                

            })
            .catch((err)=>{
                assert(false,'shall not throw error')
                done();
            })        
    });
    it('shall return error when vision is incorrect',done=>{
        taskSupport.PostTask(taskSupport.taskMediaDetection)
            .then(()=>{
                return taskSupport.PostTask(taskSupport.taskMediaInstallation)
            })            
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDetection)
            })
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDeployment)
            })            
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })            
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return scheduleSupport.postTaskForVM('visionSupport.visionAPMChef.name',dormSupport.dorm1.name,taskSupport.taskMediaInstallation.name)
            })
            .then(()=>{
                assert(false,'shall throw error')
                done();

            })
            .catch((err)=>{
                assert(err.err.status,500)
                done();
            })        
    })
    it('shall return error when task is incorrect',done=>{
        taskSupport.PostTask(taskSupport.taskMediaDetection)
            .then(()=>{
                return taskSupport.PostTask(taskSupport.taskMediaInstallation)
            })            
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDetection)
            })
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDeployment)
            })            
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })            
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return scheduleSupport.postTaskForVM(visionSupport.visionAPMChef.name,dormSupport.dorm1.name,'taskSupport.taskMediaInstallation.name')
            })
            .then(()=>{
                assert(false,'shall throw error')
                done();

            })
            .catch((err)=>{
                assert(err.err.status,500)
                done();
            })     
    });
    it('shall return error when dorm is incorrect',done=>{
        taskSupport.PostTask(taskSupport.taskMediaDetection)
            .then(()=>{
                return taskSupport.PostTask(taskSupport.taskMediaInstallation)
            })            
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDetection)
            })
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDeployment)
            })            
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })            
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return scheduleSupport.postTaskForVM(visionSupport.visionAPMChef.name,'dormSupport.dorm1.name',taskSupport.taskMediaInstallation.name)
            })
            .then(()=>{
                assert(false,'shall throw error')
                done();

            })
            .catch((err)=>{
                assert(err.err.status,500)
                done();
            })     
    });
})
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
      it('shall schedule project to the machines with right vid /schedule/vision/:vision/blueprint/:blueprint',done=>{
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
                let vidList=[{vid:'nhqa-w81-q34'},{vid:'nhqa-w81-q35'}]
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 3,vidList);
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
                            //there shall be 3 projects
                            assert.equal(vision.current_projects.length,3);
                            //only 2 project have vid while 1 does not have
                            assert.equal(vision.current_projects[0]._project.vid,'nhqa-w81-q34');
                            assert.equal(vision.current_projects[1]._project.vid,'nhqa-w81-q35');
                            assert.equal(vision.current_projects[2]._project.vid,'');
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
                return scheduleControl.MarkProjectPendingRetire(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
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

describe('schedule vision',()=>{
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
    it('shall schedule vision to the machine with enough resource',(done)=>{    
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
                //post the schedule
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                //schedule the project
                return scheduleSupport.postScheduleSignal(visionSupport.visionAPMChef.name);                
            })
            .then(()=>{
                //in the vision, the projects status shall be moved to waiting for running
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate('current_projects._project')
                    .exec((err,vision)=>{
                        assert.equal(vision.current_projects[0]._project.status,projectStatus.waitingForRunning.id);
                        assert.equal(vision.current_projects[1]._project.status,projectStatus.waitingForRunning.id);
                        done();
                    })
            })
            .catch(err=>{
                assert(false,err);
            });
    })
    it('shall change the status to pending for those machine that does not have enough resource')

});
//this test is here because it is part of scheduling process, the client will use this command to communicate with server
describe('put /project/:projectId/status/:statusId',()=>{
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
    it('shall change the status id of the given project',done=>{
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
                //post the schedule
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                //schedule the project
                return scheduleControl.ScheduleVision(visionSupport.visionAPMChef.name);
            })
            .then(()=>{
                //update the project status
                return new Promise((resolve,reject)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})
                        .then(visionList=>{
                            let vision=visionList[0];
                            let projectId=vision.current_projects[0]._project._id.toString()
                            projectSupport.putProjectStatus(projectId,projectStatus.onGoing.id)
                                .then(()=>{
                                    resolve(projectId);
                                })
                                
                            
                        })                    
                })
            })
            .then((projectId)=>{
                //validate the project status has been changed correctly
                projectModel.findById(projectId)
                    .exec((err,project)=>{
                        assert.equal(project.status,projectStatus.onGoing.id);
                        done();
                    })
            })
    })
    it('shall return 400 error when project id is invalid',done=>{
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
                //post the schedule
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                //schedule the project
                return scheduleControl.ScheduleVision(visionSupport.visionAPMChef.name);
            })
            .then(()=>{
                //update the project status
                return new Promise((resolve,reject)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})
                        .then(visionList=>{
                            let vision=visionList[0];
                            let projectId=vision.current_projects[0]._project._id.toString()
                            projectSupport.putProjectStatus('projectId',projectStatus.onGoing.id)
                                .then(()=>{
                                    resolve(projectId);
                                })
                                .catch((err)=>{
                                    reject(err);
                                })
                                
                            
                        })                    
                })
            })
            .catch((err)=>{
                //validate the project status has been changed correctly
                assert.equal(err.status,400);
                done();
            })
    })
})

describe('get /schedule/machine/:machine/projects',()=>{
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

    it('shall return all projects that associate with specific machine',done=>{
        taskSupport.PostTask(taskSupport.taskMediaDetection)
            .then(()=>{
                return taskSupport.PostTask(taskSupport.taskMediaInstallation)
            })            
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDetection)
            })
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDeployment)
            })            
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name)
            })
            .then((projectRes)=>{
                return visionSupport.putProjectStatus(visionSupport.visionAPMChef.name,projectRes.body.projectId,projectStatus.waitingForScheduling.id);                
            })
            .then(()=>{
                //update machien ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, dormSupport.dorm1.name, 1);
            })
            .then(()=>{
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDeployment.name, dormSupport.dorm1.name, 1);
            })
            .then(()=>{

            })
            .then(()=>{
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name,projectSupport.blueprintAPMMediaDetection.name)                    
            })
            .then(()=>{
                //put project sequence
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, projectSupport.blueprintAPMMediaDeployment.name);                
            })
            .then(()=>{
                return new Promise((resolve,reject)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})                                            
                        .then((visionList)=>{
                            let vision=visionList[0];
                            let project1=vision.current_projects.find(item=>{return item._project._bluePrint.name==projectSupport.blueprintAPMMediaDetection.name});
                            resolve(project1._project._id.toString());


                        })                    
                });

            })
            .then(projectId=>{
                return scheduleSupport.postNextProject(visionSupport.visionAPMChef.name,projectId)
                            .then(()=>{
                                return scheduleSupport.postNextProject(visionSupport.visionAPMChef.name,projectId);
                            });
            })
            .then(()=>{
                return scheduleSupport.getMachineProject(dormSupport.dorm1.name);
            })            
            .then((response)=>{
                assert.equal(response.body.result.length,2);
                assert.equal(response.body.result[0]._project.status,'5');
                done();
            })
            .catch(err=>{
                console.log(err);
                assert(false,'it shall not return error');
                done();
            })
    })
    it('shall return 400 error when machine name is invalid',done=>{
        taskSupport.PostTask(taskSupport.taskMediaDetection)
            .then(()=>{
                return taskSupport.PostTask(taskSupport.taskMediaInstallation)
            })            
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDetection)
            })
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDeployment)
            })            
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name)
            })
            .then((projectRes)=>{
                return visionSupport.putProjectStatus(visionSupport.visionAPMChef.name,projectRes.body.projectId,projectStatus.waitingForScheduling.id);                
            })
            .then(()=>{
                //update machien ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, dormSupport.dorm1.name, 1);
            })
            .then(()=>{
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDeployment.name, dormSupport.dorm1.name, 1);
            })
            .then(()=>{

            })
            .then(()=>{
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name,projectSupport.blueprintAPMMediaDetection.name)                    
            })
            .then(()=>{
                //put project sequence
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, projectSupport.blueprintAPMMediaDeployment.name);                
            })
            .then(()=>{
                return new Promise((resolve,reject)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})                                            
                        .then((visionList)=>{
                            let vision=visionList[0];
                            let project1=vision.current_projects.find(item=>{return item._project._bluePrint.name==projectSupport.blueprintAPMMediaDetection.name});
                            resolve(project1._project._id.toString());


                        })                    
                });

            })
            .then(projectId=>{
                return scheduleSupport.postNextProject(visionSupport.visionAPMChef.name,projectId);
            })
            .then(()=>{
                return scheduleSupport.getMachineProject('dormSupport.dorm1.name');
            })
            .then((response)=>{
                assert(false,'shall not return pass');
                done();
            })
            .catch(err=>{
                assert(err.err.status,400);
                done();
            })
    })
})

describe('/schedule/vision/:vision/next/:project',()=>{
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
    
    it('shall firstly remove the pending task, if all pending tasks are gone, remove existing project from current project, look up project_schedule to find out potential next project, if potential next project exist, then schedule it',done=>{
        
        taskSupport.PostTask(taskSupport.taskMediaDetection)
            .then(()=>{
                return taskSupport.PostTask(taskSupport.taskMediaInstallation)
            })            
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDetection)
            })
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDeployment)
            })            
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name)
            })
            .then((projectRes)=>{
                return visionSupport.putProjectStatus(visionSupport.visionAPMChef.name,projectRes.body.projectId,projectStatus.waitingForScheduling.id);                
            })
            .then(()=>{
                //update machien ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, dormSupport.dorm1.name, 1);
            })
            .then(()=>{
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDeployment.name, dormSupport.dorm1.name, 1);
            })                        
            .then(()=>{
                //put project sequence
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, projectSupport.blueprintAPMMediaDeployment.name);                
            })
            .then(()=>{
                return new Promise((resolve,reject)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})                                            
                        .then((visionList)=>{
                            let vision=visionList[0];
                            let project1=vision.current_projects.find(item=>{return item._project._bluePrint.name==projectSupport.blueprintAPMMediaDetection.name});
                            resolve(project1._project._id.toString());


                        })                    
                });

            })
            .then(projectId=>{
                return scheduleSupport.postNextProject(visionSupport.visionAPMChef.name,projectId)
                            .then(()=>{
                                //verify that the pending task is removed
                                return new Promise((resolve,reject)=>{
                                    projectModel.findById(projectId)
                                        .then(project=>{
                                            assert.equal(project.pending_tasks.length,0);
                                            resolve();
                                        })
                                        .catch(err=>{
                                            reject(err);
                                        })
                                });


                            })
                            .then(()=>{
                                return scheduleSupport.postNextProject(visionSupport.visionAPMChef.name,projectId);
                            });
            })                       
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})                    
                    .then((visionList)=>{
                        let vision=visionList[0];
                        assert.equal(vision.current_projects.length,2)
                        assert.equal(vision.current_projects[0]._project._bluePrint.name,projectSupport.blueprintAPMMediaDetection.name)
                        assert.equal(vision.current_projects[0]._project.status,projectStatus.pendingRetire.id);
                        assert.equal(vision.current_projects[1]._project._bluePrint.name,projectSupport.blueprintAPMMediaDeployment.name)
                        assert.equal(vision.current_projects[1]._project.status,projectStatus.waitingForRunning.id);
                        done();
                    });
            })
            .catch((err)=>{
                assert(false,'it shall not return error')
            })

    });
    it('shall schedule task based on the instance specified',done=>{
        taskSupport.PostTask(taskSupport.taskMediaDetection)
            .then(()=>{
                return taskSupport.PostTask(taskSupport.taskMediaInstallation)
            })  
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDetection)
            })
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDeployment)
            })            
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name)
            })
            .then((projectRes)=>{
                return visionSupport.putProjectStatus(visionSupport.visionAPMChef.name,projectRes.body.projectId,projectStatus.waitingForScheduling.id);                
            })
            .then(()=>{
                //update machien ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, dormSupport.dorm1.name, 1);
            })
            .then(()=>{
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDeployment.name, dormSupport.dorm1.name, 3);
            })                        
            .then(()=>{
                //put project sequence
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, projectSupport.blueprintAPMMediaDeployment.name);                
            })
            .then(()=>{
                return new Promise((resolve,reject)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})                                            
                        .then((visionList)=>{
                            let vision=visionList[0];
                            let project1=vision.current_projects.find(item=>{return item._project._bluePrint.name==projectSupport.blueprintAPMMediaDetection.name});
                            resolve(project1._project._id.toString());


                        })                    
                });

            })
            .then(projectId=>{
                return scheduleSupport.postNextProject(visionSupport.visionAPMChef.name,projectId)
                            .then(()=>{
                                return scheduleSupport.postNextProject(visionSupport.visionAPMChef.name,projectId);
                            });
            })
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})                    
                    .then((visionList)=>{
                        let vision=visionList[0];
                        assert.equal(vision.current_projects.length,4)
                        let i=0;
                        vision.current_projects.forEach(item=>{
                            if(i==0){
                                assert.equal(item._project._bluePrint.name,projectSupport.blueprintAPMMediaDetection.name)
                                assert.equal(item._project.status,projectStatus.pendingRetire.id);                                   
                            }
                            else{
                                assert.equal(item._project._bluePrint.name,projectSupport.blueprintAPMMediaDeployment.name)
                                assert.equal(item._project.status,projectStatus.waitingForRunning.id);                                
                            }

                            i++;
                        })
                        
                        
                        done();
                    });
            })
            .catch((err)=>{
                assert(false,'it shall not return error')
            })

    });
    it('shall return 400 error when vision name is invalid',done=>{
        taskSupport.PostTask(taskSupport.taskMediaDetection)
            .then(()=>{
                return taskSupport.PostTask(taskSupport.taskMediaInstallation)
            })  
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDetection)
            })
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDeployment)
            })            
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name)
            })
            .then((projectRes)=>{
                return visionSupport.putProjectStatus(visionSupport.visionAPMChef.name,projectRes.body.projectId,projectStatus.waitingForScheduling.id);                
            })
            .then(()=>{
                //update machien ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, dormSupport.dorm1.name, 1);
            })
            .then(()=>{
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDeployment.name, dormSupport.dorm1.name, 1);
            })                        
            .then(()=>{
                //put project sequence
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, projectSupport.blueprintAPMMediaDeployment.name);                
            })
            .then(()=>{
                return new Promise((resolve,reject)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})                                            
                        .then((visionList)=>{
                            let vision=visionList[0];
                            let project1=vision.current_projects.find(item=>{return item._project._bluePrint.name==projectSupport.blueprintAPMMediaDetection.name});
                            resolve(project1._project._id.toString());


                        })                    
                });

            })
            .then(projectId=>{
                return scheduleSupport.postNextProject('visionSupport.visionAPMChef.name',projectId);
            })
            .then(()=>{
                assert(false,'it shall not return error')
                done();
            })
            .catch((err)=>{
                assert.equal(err.err.status,400)
                done();
            })

    });
    it('shall return 400 error when project name is invalid',done=>{
        taskSupport.PostTask(taskSupport.taskMediaDetection)
            .then(()=>{
                return taskSupport.PostTask(taskSupport.taskMediaInstallation)
            })  
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDetection)
            })
            .then(()=>{
                projectSupport.PostNewBlueprint(projectSupport.blueprintAPMMediaDeployment)
            })            
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name)
            })
            .then((projectRes)=>{
                return visionSupport.putProjectStatus(visionSupport.visionAPMChef.name,projectRes.body.projectId,projectStatus.waitingForScheduling.id);                
            })
            .then(()=>{
                //update machien ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, dormSupport.dorm1.name, 1);
            })
            .then(()=>{
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDeployment.name, dormSupport.dorm1.name, 1);
            })                        
            .then(()=>{
                //put project sequence
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, projectSupport.blueprintAPMMediaDeployment.name);                
            })
            .then(()=>{
                return new Promise((resolve,reject)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})                                            
                        .then((visionList)=>{
                            let vision=visionList[0];
                            let project1=vision.current_projects.find(item=>{return item._project._bluePrint.name==projectSupport.blueprintAPMMediaDetection.name});
                            resolve(project1._project._id.toString());


                        })                    
                });

            })
            .then(projectId=>{
                return scheduleSupport.postNextProject(visionSupport.visionAPMChef.name,'projectId');
            })
            .then(()=>{
                assert(false,'it shall not return error')
                done();
            })
            .catch((err)=>{
                assert.equal(err.err.status,400)
                done();
            })

    });



})

