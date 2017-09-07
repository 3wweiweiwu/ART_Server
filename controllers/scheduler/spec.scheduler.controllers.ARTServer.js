process.env.NODE_ENV = 'test';


var assert = require('assert');
var visionModel = require('../../model/vision/vision.model.ARTServer.js');
var taskModel = require('../../model/task/task.model.ARTServer');
var taskImageDeployment = require('../../model/task/imageDeploy.model.ARTServer');
var projectBlueprintModel = require('../../model/project/projectBlueprint.model.ARTServer');
var projectModel = require('../../model/project/project.model.ARTServer');
let projectStatus=require('../project/status.project.controllers.ARTServer');


let dormSupport = require('../organization/support.dorm.controller.ARTServer');
let dormModel = require('../../model/organization/dormModel');
let scheduleControl=require('./scheduler.controllers.ARTServer');
let scheduleSupport=require('./support.scheduler.controllers.ARTServer');
var visionControl = require('../vision/vision.controllers.ARTServer');
let projectSupport = require('../../controllers/project/support.project.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');
let chai = require('chai');
let chaiHttp = require('chai-http');
let visionSupport = require('../vision/support.vision.controllers.ARTServer');
chai.use(chaiHttp);
describe('post /schedule/vision/:vision/vm/:vm/blueprint/:blueprint/task/:task',()=>{
    beforeEach((done) => {
        taskModel.remove({}, () => {
            taskImageDeployment.remove({}, () => {

                projectBlueprintModel.remove({}, () => {
                    projectModel.remove({}).exec(() => {
                        visionModel.remove({}).exec(() => {
                            dormModel.remove({}).exec(() => {
                                done();
                            });

                        });

                    });
                });

            });

        });

    });  
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
    it('shall delete other project in current_project with similar vm name',done=>{
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
                
                return scheduleSupport.postTaskForVM(visionSupport.visionAPMChef.name,dormSupport.dorm1.name,projectSupport.blueprintAPMMediaDeployment.name,taskSupport.taskMediaInstallation.name)
                    .then(()=>{
                        return scheduleSupport.postTaskForVM(visionSupport.visionAPMChef.name,dormSupport.dorm1.name,projectSupport.blueprintAPMMediaDeployment.name,taskSupport.taskMediaDetection.name);
                    });
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
                            }));
                        
                    });
                

            })
            .catch(()=>{
                assert(false,'shall not throw error');
                done();
            });        
    });
    it('shall have only 1 instance of object in the vision and 100 project shall have been created',done=>{
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
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm2);
            })                 
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                let promiseList=[];
                for(let i=0;i<100;i++){
                    promiseList.push(scheduleSupport.postTaskForVM(visionSupport.visionAPMChef.name,dormSupport.dorm1.name,projectSupport.blueprintAPMMediaDeployment.name,taskSupport.taskMediaInstallation.name));
                    promiseList.push(scheduleSupport.postTaskForVM(visionSupport.visionAPMChef.name,dormSupport.dorm2.name,projectSupport.blueprintAPMMediaDeployment.name,taskSupport.taskMediaDetection.name));
                }
                
                return Promise.all(promiseList);

            })
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})
                    .then(visionList=>{
                        
                        let vision=visionList[0];
                        //new project shall be added to the current project list
                        assert(vision.__v,200);
                        projectModel.find()
                            .then((projects)=>{
                                assert.equal(projects.length,200);
                                done();
                            });

                        
                    });
                

            })
            .catch(()=>{
                assert(false,'shall not throw error');
                done();
            });        
    });    
    it('shall return error when vision is incorrect',done=>{
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
                return scheduleSupport.postTaskForVM('visionSupport.visionAPMChef.name',dormSupport.dorm1.name,projectSupport.blueprintAPMMediaDeployment.name,taskSupport.taskMediaInstallation.name);
            })
            .then(()=>{
                assert(false,'shall throw error');
                done();

            })
            .catch((err)=>{
                assert(err.err.status,500);
                done();
            });        
    });
    it('shall return error when task is incorrect',done=>{
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
                return scheduleSupport.postTaskForVM(visionSupport.visionAPMChef.name,dormSupport.dorm1.name,projectSupport.blueprintAPMMediaDeployment.name,'taskSupport.taskMediaInstallation.name');
            })
            .then(()=>{
                assert(false,'shall throw error');
                done();

            })
            .catch((err)=>{
                assert(err.err.status,500);
                done();
            });     
    });
    it('shall return error when dorm is incorrect',done=>{
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
                return scheduleSupport.postTaskForVM(visionSupport.visionAPMChef.name,'dormSupport.dorm1.name',projectSupport.blueprintAPMMediaDeployment.name,taskSupport.taskMediaInstallation.name);
            })
            .then(()=>{
                assert(false,'shall throw error');
                done();

            })
            .catch((err)=>{
                assert(err.err.status,500);
                done();
            });     
    });

    it('shall return error when blueprint is incorrect',done=>{
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
                return scheduleSupport.postTaskForVM(visionSupport.visionAPMChef.name,dormSupport.dorm1.name,'projectSupport.blueprintAPMMediaDeployment.name',taskSupport.taskMediaInstallation.name);
            })
            .then(()=>{
                assert(false,'shall throw error');
                done();

            })
            .catch((err)=>{
                assert(err.err.status,500);
                done();
            });     
    });    
});
describe('post /schedule/vision/:vision/blueprint/:blueprint',()=>{
    beforeEach((done) => {
        taskModel.remove({}, () => {
            taskImageDeployment.remove({}, () => {

                projectBlueprintModel.remove({}, () => {
                    projectModel.remove({}).exec(() => {
                        visionModel.remove({}).exec(() => {
                            dormModel.remove({}).exec(() => {
                                done();
                            });

                        });

                    });
                });

            });

        });

    });    
    it('shall schedule project to the machines if there is enough resource /schedule/vision/:vision/blueprint/:blueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)            
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                //post dorm
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(() => {
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 2,[{vid:'s1',group_number:1},{vid:'s2',group_number:2}]);
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
                            assert.notEqual(vision.current_projects[0]._id,vision.current_projects[1]._id);
                            done();
                        }
                    });
            })
            .catch(err=>{
                assert(false,`shall not throw error ${err}`);
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
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(() => {
                //update machine ask
                let vidList=[{vid:'nhqa-w81-q34'},{vid:'nhqa-w81-q35'}];
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
                            assert.equal(vision.current_projects.filter(item=>{return item._project.vid=='nhqa-w81-q34';}).length,1);
                            assert.equal(vision.current_projects.filter(item=>{return item._project.vid=='nhqa-w81-q35';}).length,1);
                            assert.equal(vision.current_projects.filter(item=>{return item._project.vid=='';}).length,1);                            
                            
                            done();
                        }
                    });
            })
            .catch(err=>{
                assert(false,`it shall not throw error ${err}`);
                assert(false,`it shall not throw error ${err}`);
                done();
            });
    });
    it('shall schedule group 0 when there is no vid group info specified /schedule/vision/:vision/blueprint/:blueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)            
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                //post dorm
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(() => {
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 2,[{vid:'s1',group_number:1},{vid:'s2',group_number:2}]);
            })
            .then(()=>{
                
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})
                    .then(visionList=>{
                        let vision= visionList[0];
                        assert.equal(vision.current_projects.filter(item=>{return item._project.vid=='s1';}).length,1);
                        assert.equal(vision.current_projects.filter(item=>{return item._project.vid=='';}).length,1);
                        //assert.equal(vision.current_projects[1]._project.vid,"");
                        done();
                    });
            })
            .catch(err=>{
                assert(false,`it shall not throw error ${err}`);
                done();
            });        
    });
    it('shall create a new vid group info with number 1 when there is no vid group info specified /schedule/vision/:vision/blueprint/:blueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)            
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                //post dorm
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(() => {
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 2,[{vid:'s1',group_number:1},{vid:'s2',group_number:2}]);
            })
            .then(()=>{
                
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})
                    .then(visionList=>{
                        let vision= visionList[0];
                        assert.equal(vision.info.project_schedule.length,1);
                        assert.equal(vision.info.project_schedule[0].vid_group_info.project_blueprint.name,projectSupport.projectAPMPrestaging.name);
                        assert.equal(vision.info.project_schedule[0].vid_group_info.current_group_number,1);
                        done();
                    });
            })
            .catch(err=>{
                assert(false,`it shall not throw error ${err}`);
                done();
            });
    });   
    it('shall increase current group number  everytime we schedule a vm group /schedule/vision/:vision/blueprint/:blueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)            
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                //post dorm
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(() => {
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 2,[{vid:'s1',group_number:1},{vid:'s2',group_number:2}]);
            })
            .then(()=>{
                
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })            
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})
                    .then(visionList=>{
                        let vision= visionList[0];
                        //it shall increase the group number 
                        assert.equal(vision.info.project_schedule.length,1);
                        assert.equal(vision.info.project_schedule[0].vid_group_info.project_blueprint.name,projectSupport.projectAPMPrestaging.name);
                        assert.equal(vision.info.project_schedule[0].vid_group_info.current_group_number,2);

                        //it shall schedule 2 more new run whose vid are s2 and "" respectively
                        assert.equal(vision.current_projects.filter(item=>{return item._project.vid=='s1';}).length,1);
                        assert.equal(vision.current_projects.filter(item=>{return item._project.vid=='s2';}).length,1);
                        assert.equal(vision.current_projects.filter(item=>{return item._project.vid=='';}).length,2);

                        done();
                    });
            })
            .catch(err=>{
                assert(false,`it shall not throw error ${err}`);
                done();
            });          
    });
    it('shall schedule 2 instance with vid s1 and s2 when 2 vid is specified and instance # for machine ask is 1 /schedule/vision/:vision/blueprint/:blueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)            
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                //post dorm
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(() => {
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 1,[{vid:'s1',group_number:1},{vid:'s2',group_number:1}]);
            })
            .then(()=>{
                
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})
                    .then(visionList=>{
                        let vision= visionList[0];
                        assert.equal(vision.current_projects.length,2);
                        assert.equal(vision.current_projects.filter(item=>{return item._project.vid=='s1';}).length,1);
                        assert.equal(vision.current_projects.filter(item=>{return item._project.vid=='s2';}).length,1);
                        
                        done();
                    });
            })
            .catch(err=>{
                assert(false,`'it shall not throw error ${err}`);
                done();
            });           
    });    
    it('shall schedule 2 instance with no vid info when machine ask is 2 and no vid specified',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)            
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                //post dorm
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(() => {
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 2);
            })
            .then(()=>{
                
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})
                    .then(visionList=>{
                        let vision= visionList[0];
                        assert.equal(vision.current_projects.length,2);   
                        assert.equal(vision.current_projects.length,2);
                        assert.equal(vision.current_projects[0]._project.vid,'');
                        assert.equal(vision.current_projects[1]._project.vid,'');                                             
                        done();
                    });
            })
            .catch(err=>{
                assert(false,`it shall not throw error ${err}`);
                done();
            });         
    });
   
    it('shall schedule group 1 when we schedule instance 3rd time /schedule/vision/:vision/blueprint/:blueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)            
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                //post dorm
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(() => {
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 0,[{vid:'s1',group_number:1},{vid:'s2',group_number:2}]);
            })
            .then(()=>{
                
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })  
            .then(()=>{
                
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })                         
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})
                    .then(visionList=>{
                        let vision= visionList[0];
                        //it shall increase the group number 
                        assert.equal(vision.info.project_schedule.length,1);
                        assert.equal(vision.info.project_schedule[0].vid_group_info.project_blueprint.name,projectSupport.projectAPMPrestaging.name);
                        assert.equal(vision.info.project_schedule[0].vid_group_info.current_group_number,3);

                        //it shall schedule 2 more new run whose vid are s2 and "" respectively
                        assert.equal(vision.current_projects[0]._project.vid,'s1');
                        assert.equal(vision.current_projects[1]._project.vid,'s2');
                        assert.equal(vision.current_projects[2]._project.vid,'s1');
                        
                        done();
                    });
            })
            .catch(err=>{
                assert(false,`it shall not throw error ${err}`);
                done();
            });         
    });
    it('shall schedule 3rd group when we schedule instance 3rd time /schedule/vision/:vision/blueprint/:blueprint',done=>{    
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)            
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                //post dorm
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(() => {
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 0,[{vid:'s1',group_number:1},{vid:'s2',group_number:2},{vid:'s5',group_number:5}]);
            })
            .then(()=>{
                
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })  
            .then(()=>{
                
                return scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })                         
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})
                    .then(visionList=>{
                        let vision= visionList[0];
                        //it shall increase the group number 
                        assert.equal(vision.info.project_schedule.length,1);
                        assert.equal(vision.info.project_schedule[0].vid_group_info.project_blueprint.name,projectSupport.projectAPMPrestaging.name);
                        assert.equal(vision.info.project_schedule[0].vid_group_info.current_group_number,3);

                        //it shall schedule 2 more new run whose vid are s2 and "" respectively
                        assert.equal(vision.current_projects[0]._project.vid,'s1');
                        assert.equal(vision.current_projects[1]._project.vid,'s2');
                        assert.equal(vision.current_projects[2]._project.vid,'s5');
                        
                        done();
                    });
            })
            .catch(err=>{
                assert(false,`it shall not throw error ${err}`);
                done();
            });         

    });
    it('have 100 instance in the project 34 s1, 33s2, 33s5, when we schedule blueprint for 100 times /schedule/vision/:vision/blueprint/:blueprint',done=>{    
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)            
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                //post dorm
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(() => {
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 0,[{vid:'s1',group_number:1},{vid:'s2',group_number:2},{vid:'s5',group_number:5}]);
            })
            .then(()=>{
                let promiseList=[];
                for(let i=0;i<100;i++){
                    promiseList.push(scheduleSupport.postScheduleFromBlueprint(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name));
                }

                return new Promise((resolve,reject)=>{
                    Promise.all(promiseList)
                        .then(()=>{
                            resolve();
                        })
                        .catch(()=>{
                            reject();
                        });
                });
            })                    
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})
                    .then(visionList=>{
                        let vision= visionList[0];
                        //it shall increase the group number 
                        assert.equal(vision.info.project_schedule.length,1);
                        assert.equal(vision.info.project_schedule[0].vid_group_info.current_group_number,100);
                        let projects1=vision.current_projects.filter(item=>{
                            return item._project.vid=='s1';
                        });
                        let projects2=vision.current_projects.filter(item=>{
                            return item._project.vid=='s2';
                        });
                        let projects5=vision.current_projects.filter(item=>{
                            return item._project.vid=='s5';
                        });
                        assert.equal(projects1.length,34);
                        assert.equal(projects2.length,33);
                        assert.equal(projects5.length,33);

                        done();
                    });
            })
            .catch(err=>{
                assert(false,`it shall not throw error ${err}`);
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
                return dormSupport.PostDorm(dormSupport.dorm1);
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
                return dormSupport.PostDorm(dormSupport.dorm1);
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
        taskModel.remove({}, () => {
            taskImageDeployment.remove({}, () => {

                projectBlueprintModel.remove({}, () => {
                    projectModel.remove({}).exec(() => {
                        visionModel.remove({}).exec(() => {
                            dormModel.remove({}).exec(() => {
                                done();
                            });

                        });

                    });
                });

            });

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
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(() => {
                //update machine ask
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 2);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAESPrestaging.name);
            })               
            .then(()=>{
                return scheduleControl.MarkProjectPendingRetire(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
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
                                return item._project._bluePrint.name==blueprint;
                            })
                            .forEach(item=>{
                                assert.equal(item._project.status,projectStatus.pendingRetire.id);
                            });
                        vision.current_projects
                            .filter(item=>{
                                return item._project._bluePrint.name!=blueprint;
                            })
                            .forEach(item=>{
                                assert.equal(item._project.status,projectStatus.waitingForScheduling.id);
                            });
                        done();
                    });

                
            })
            .catch(err=>{
                assert(false,`it shall not throw error ${err}`);
                done();
            });
    });       
  
});

describe('schedule vision',()=>{
    beforeEach((done) => {
        taskModel.remove({}, () => {
            taskImageDeployment.remove({}, () => {

                projectBlueprintModel.remove({}, () => {
                    projectModel.remove({}).exec(() => {
                        visionModel.remove({}).exec(() => {
                            dormModel.remove({}).exec(() => {
                                done();
                            });

                        });

                    });
                });

            });

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
                return dormSupport.PostDorm(dormSupport.dorm1);
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
                    });
            })
            .catch(err=>{
                assert(false,err);
            });
    });
    it('shall change the status to pending for those machine that does not have enough resource');

});
//this test is here because it is part of scheduling process, the client will use this command to communicate with server
describe('put /project/:projectId/status/:statusId',()=>{
    beforeEach((done) => {
        taskModel.remove({}, () => {
            taskImageDeployment.remove({}, () => {

                projectBlueprintModel.remove({}, () => {
                    projectModel.remove({}).exec(() => {
                        visionModel.remove({}).exec(() => {
                            dormModel.remove({}).exec(() => {
                                done();
                            });

                        });

                    });
                });

            });

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
                return dormSupport.PostDorm(dormSupport.dorm1);
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
                return new Promise((resolve)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})
                        .then(visionList=>{
                            let vision=visionList[0];
                            let projectId=vision.current_projects[0]._project._id.toString();
                            projectSupport.putProjectStatus(projectId,projectStatus.onGoing.id)
                                .then(()=>{
                                    resolve(projectId);
                                });
                                
                            
                        });                    
                });
            })
            .then((projectId)=>{
                //validate the project status has been changed correctly
                projectModel.findById(projectId)
                    .exec((err,project)=>{
                        assert.equal(project.status,projectStatus.onGoing.id);
                        done();
                    });
            });
    });
    it('shall return 400 error when project id is invalid',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(projectSupport.postProjectBlueprintAESPrestaging)                        
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                //post dorm
                return dormSupport.PostDorm(dormSupport.dorm1);
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
                            let projectId=vision.current_projects[0]._project._id.toString();
                            projectSupport.putProjectStatus('projectId',projectStatus.onGoing.id)
                                .then(()=>{
                                    resolve(projectId);
                                })
                                .catch((err)=>{
                                    reject(err);
                                });
                                
                            
                        });                    
                });
            })
            .catch((err)=>{
                //validate the project status has been changed correctly
                assert.equal(err.status,400);
                done();
            });
    });
});

describe('get /schedule/machine/:machine/projects',()=>{
    beforeEach((done) => {
        taskModel.remove({}, () => {
            taskImageDeployment.remove({}, () => {

                projectBlueprintModel.remove({}, () => {
                    projectModel.remove({}).exec(() => {
                        visionModel.remove({}).exec(() => {
                            dormModel.remove({}).exec(() => {
                                done();
                            });

                        });

                    });
                });

            });

        });

    }); 

    it('shall return all projects that associate with specific machine',done=>{
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
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name);
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
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name,projectSupport.blueprintAPMMediaDetection.name);                    
            })
            .then(()=>{
                //put project sequence
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, projectSupport.blueprintAPMMediaDeployment.name);                
            })
            .then(()=>{
                return new Promise((resolve)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})                                            
                        .then((visionList)=>{
                            let vision=visionList[0];
                            let project1=vision.current_projects.find(item=>{return item._project._bluePrint.name==projectSupport.blueprintAPMMediaDetection.name;});
                            resolve(project1._project._id.toString());


                        });                    
                });

            })
            .then(projectId=>{
                return scheduleSupport.postNextProject(visionSupport.visionAPMChef.name,projectId);
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
                
                assert(false,`it shall not throw error ${err}`);
                done();
            });
    });
    it('shall return 400 error when machine name is invalid',done=>{
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
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name);
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
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name,projectSupport.blueprintAPMMediaDetection.name);                    
            })
            .then(()=>{
                //put project sequence
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, projectSupport.blueprintAPMMediaDeployment.name);                
            })
            .then(()=>{
                return new Promise((resolve)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})                                            
                        .then((visionList)=>{
                            let vision=visionList[0];
                            let project1=vision.current_projects.find(item=>{return item._project._bluePrint.name==projectSupport.blueprintAPMMediaDetection.name;});
                            resolve(project1._project._id.toString());


                        });                    
                });

            })
            .then(projectId=>{
                return scheduleSupport.postNextProject(visionSupport.visionAPMChef.name,projectId);
            })
            .then(()=>{
                return scheduleSupport.getMachineProject('dormSupport.dorm1.name');
            })
            .then(()=>{
                assert(false,'shall not return pass');
                done();
            })
            .catch(err=>{
                assert(err.err.status,400);
                done();
            });
    });
});

describe('/schedule/vision/:vision/next/:project',()=>{
    beforeEach((done) => {
        taskModel.remove({}, () => {
            taskImageDeployment.remove({}, () => {

                projectBlueprintModel.remove({}, () => {
                    projectModel.remove({}).exec(() => {
                        visionModel.remove({}).exec(() => {
                            dormModel.remove({}).exec(() => {
                                done();
                            });

                        });

                    });
                });

            });

        });

    });  
    
    it('shall firstly remove the pending task, if all pending tasks are gone, remove existing project from current project, look up project_schedule to find out potential next project, if potential next project exist, then schedule it',done=>{
        
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
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name);
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
                return new Promise((resolve)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})                                            
                        .then((visionList)=>{
                            let vision=visionList[0];
                            let project1=vision.current_projects.find(item=>{return item._project._bluePrint.name==projectSupport.blueprintAPMMediaDetection.name;});
                            resolve(project1._project._id.toString());


                        });                    
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
                                });
                        });


                    });
            })                       
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})                    
                    .then((visionList)=>{
                        let vision=visionList[0];
                        assert.equal(vision.current_projects.length,2);
                        assert.equal(vision.current_projects[0]._project._bluePrint.name,projectSupport.blueprintAPMMediaDetection.name);
                        assert.equal(vision.current_projects[0]._project.status,projectStatus.pendingRetire.id);
                        assert.equal(vision.current_projects[1]._project._bluePrint.name,projectSupport.blueprintAPMMediaDeployment.name);
                        assert.equal(vision.current_projects[1]._project.status,projectStatus.waitingForRunning.id);
                        done();
                    });
            })
            .catch((err)=>{
                assert(false,`it shall not throw error ${err}`);
            });

    });
    it('shall schedule task based on the instance specified',done=>{
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
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name);
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
                return new Promise((resolve)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})                                            
                        .then((visionList)=>{
                            let vision=visionList[0];
                            let project1=vision.current_projects.find(item=>{return item._project._bluePrint.name==projectSupport.blueprintAPMMediaDetection.name;});
                            resolve(project1._project._id.toString());


                        });                    
                });

            })
            .then(projectId=>{
                return scheduleSupport.postNextProject(visionSupport.visionAPMChef.name,projectId);
            })
            .then(()=>{
                visionControl.getVision({name:visionSupport.visionAPMChef.name})                    
                    .then((visionList)=>{
                        let vision=visionList[0];
                        assert.equal(vision.current_projects.length,4);
                        let i=0;
                        vision.current_projects.forEach(item=>{
                            if(i==0){
                                assert.equal(item._project._bluePrint.name,projectSupport.blueprintAPMMediaDetection.name);
                                assert.equal(item._project.status,projectStatus.pendingRetire.id);                                   
                            }
                            else{
                                assert.equal(item._project._bluePrint.name,projectSupport.blueprintAPMMediaDeployment.name);
                                assert.equal(item._project.status,projectStatus.waitingForRunning.id);                                
                            }

                            i++;
                        });
                        
                        
                        done();
                    });
            })
            .catch((err)=>{
                assert(false,`it shall not throw error ${err}`);
            });

    });
    it('shall return 400 error when vision name is invalid',done=>{
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
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name);
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
                return new Promise((resolve)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})                                            
                        .then((visionList)=>{
                            let vision=visionList[0];
                            let project1=vision.current_projects.find(item=>{return item._project._bluePrint.name==projectSupport.blueprintAPMMediaDetection.name;});
                            resolve(project1._project._id.toString());


                        });                    
                });

            })
            .then(projectId=>{
                return scheduleSupport.postNextProject('visionSupport.visionAPMChef.name',projectId);
            })
            .then(()=>{
                assert(false,'it shall not return error');
                done();
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                done();
            });

    });
    it('shall return 400 error when project name is invalid',done=>{
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
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name);
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
                return new Promise((resolve)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})                                            
                        .then((visionList)=>{
                            let vision=visionList[0];
                            let project1=vision.current_projects.find(item=>{return item._project._bluePrint.name==projectSupport.blueprintAPMMediaDetection.name;});
                            resolve(project1._project._id.toString());


                        });                    
                });

            })
            .then(()=>{
                return scheduleSupport.postNextProject(visionSupport.visionAPMChef.name,'projectId');
            })
            .then(()=>{
                assert(false,'it shall not return error');
                done();
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                done();
            });

    });

    it('shall remove existing project whose blueprints are the same as the upcoming project',done=>{
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
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.blueprintAPMMediaDetection.name);
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
                //put project sequence
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.blueprintAPMMediaDetection.name, projectSupport.blueprintAPMMediaDetection.name);                
            })            
            .then(()=>{
                return new Promise((resolve)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})                                            
                        .then((visionList)=>{
                            let vision=visionList[0];
                            let project1=vision.current_projects.find(item=>{return item._project._bluePrint.name==projectSupport.blueprintAPMMediaDetection.name;});
                            resolve(project1._project._id.toString());


                        });                    
                });

            })
            .then(projectId=>{
                return scheduleSupport.postNextProject(visionSupport.visionAPMChef.name,projectId);
            })                       
            .then(()=>{
                return new Promise((resolve)=>{
                    visionControl.getVision({name:visionSupport.visionAPMChef.name})                    
                        .then((visionList)=>{
                        
                            let vision=visionList[0];                            
                            let newMediaScheduleProject=vision.current_projects.find(item=>{
                                return (item._project.status==projectStatus.waitingForRunning.id && item._project._bluePrint.name==projectSupport.blueprintAPMMediaDetection.name);
                            });
                            resolve(newMediaScheduleProject._project._id.toString());
                        });

                });
            })
            .then(projectId=>{
                return scheduleSupport.postNextProject(visionSupport.visionAPMChef.name,projectId);
            })
            .then(()=>{
                return visionControl.getVision({name:visionSupport.visionAPMChef.name});
            })    
            .then((visionList)=>{
                //first 3 projec's status become pending retire(4)
                //, last 2 project's status shall become waiting for schedule(5)
                // last 2 project's blueprint name are media detector and media deployment
                let vision=visionList[0];
                
                assert.equal(vision.current_projects[0]._project.status,projectStatus.pendingRetire.id);                
                assert.equal(vision.current_projects[1]._project.status,projectStatus.pendingRetire.id);
                assert.equal(vision.current_projects[2]._project.status,projectStatus.pendingRetire.id);
                let project1=vision.current_projects.find(item=>{
                    return (item._project.status==projectStatus.waitingForRunning.id && item._project._bluePrint.name==projectSupport.blueprintAPMMediaDetection.name);
                }); 
                let project2=vision.current_projects.find(item=>{
                    return (item._project.status==projectStatus.waitingForRunning.id && item._project._bluePrint.name==projectSupport.blueprintAPMMediaDeployment.name);
                }); 
                assert(project1!=null);
                assert(project2!=null)
                done();
            })
            .catch((err)=>{
                assert(false,`it shall not throw error ${err}`);
            });        
    });

});

