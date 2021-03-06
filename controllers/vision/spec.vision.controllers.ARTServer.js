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

describe('post /vision', () => {
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
    it('shall throw error when argument is not complete', (done) => {
        visionSupport.postNewVision(visionSupport.visionAPMChefIncomplete)
            .then((info) => {
                assert.equal(400, info.status);
                assert(false, 'error with post');
                done();
            })
            .catch((err) => {
                assert.equal(err.resInfo.status, 400);
                done();
            })
    })
    it('shall be able to create vision', (done) => {
        visionSupport.postNewVision(visionSupport.visionAPMChef)
            .then(visionSupport.PostVisionAPMChefoffline)
            .then((info) => {
                assert.equal(200, info.status);
                visionControl.getVision({})
                    .then((info) => {
                        assert.equal(info.length, 1);
                        assert.equal(info[0].status, visionSupport.visionAPMChefOffline.status);
                        done();
                    });


            })
    });
    it('shall post new project into vision with /vision/:vision/NewProject/:blueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)        
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })
            .then(()=>{
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate('current_projects._project')
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,err);
                            done();
                        }
                        else{
                            assert.equal(vision.current_projects.length,1);
                            assert.equal(vision.current_projects[0]._project.status,1);
                            done();
                        }
                    });                  
            })
    });
    it('shall throw 400 error with invalid vision name /vision/:vision/NewProject/:blueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)        
            .then(()=>{
                return visionSupport.postNewProject('invalid vision name',projectSupport.projectAPMPrestaging.name)
            })
            .then(()=>{
                assert.fail(false,'the vision name is invalid. expect error 400')
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate('current_projects._project')
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,err);
                            done();
                        }
                        else{
                            assert.equal(vision.current_projects.length,0);                            
                            done();
                        }
                    });                  
            })
    });
    it('shall throw 400 error when invalid blueprint name /vision/:vision/NewProject/:blueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)        
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,'invalid blueprint')
            })
            .then(()=>{
                assert.fail(false,'the vision name is invalid. expect error 400')
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate('current_projects._project')
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,err);
                            done();
                        }
                        else{
                            assert.equal(vision.current_projects.length,0);                            
                            done();
                        }
                    });                  
            })
    });

});

describe('get /vision', () => {
    before((done) => {
        visionModel.remove({}, (err) => {
            done();
        })
    });
    it('shall return nothing when it is empty', (done) => {
        chai
            .request(app)
            .get('/api/vision')
            .end((err, res) => {
                assert.equal(res.body.length, 0);
                done();
            });
    });
    it('shall return no task when using /vision/:taskname against empty db', (done) => {
        chai
            .request(app)
            .get('/api/vision/something')
            .end((err, res) => {
                assert.equal(res.body.length, 0);
                done();
            });
    });
    it('shall return specific task when using /vision/:taskname against filled db', (done) => {
        visionSupport.postNewVision(visionSupport.visionAESChef)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                chai
                    .request(app)
                    .get('/api/vision/' + visionSupport.visionAPMChef.name)
                    .end((err, res) => {
                        assert.equal(res.body.length, 1);
                        assert.equal(res.body[0].name, visionSupport.visionAPMChef.name);
                        done();
                    });
            })
    });

    it('shall return all task when using /vision', (done) => {
        chai
            .request(app)
            .get('/api/vision/')
            .end((err, res) => {
                assert.equal(res.body.length, 2);
                assert.equal(res.body[1].name, visionSupport.visionAPMChef.name);
                assert.equal(res.body[0].name, visionSupport.visionAESChef.name);
                done();
            });
    });

    it('shall return empty registry when there is nothing using /vision/:vision_name/registry/:key', done => {
        visionSupport.GetRegistry(visionSupport.visionAESChef, 'invalid')
            .then(result => {
                assert(false, 'should not find value')
                done();
            })
            .catch(result => {
                assert.equal(result.res.status, 400);
                done();
            });
    });
    it('shall return valueusing /vision/:vision_name/registry/:key', (done) => {
        visionSupport.postNewVision(visionSupport.visionAPMChef)
            .then(visionSupport.PutRegistryMachine1)
            .then(visionSupport.PutRegistryMachine2)
            .then(visionSupport.GetRegistryForMachineName)
            .then(result => {
                assert.equal(result.body.value, visionSupport.registryMachineName2.value);
                done();
            });
    });

});


describe('put /vision', () => {
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

    

    it('shall return 400 if vision name is invalid when putting against /vision/:vision_name/key_projects/:projectName', (done) => {
        chai
            .request(app)
            .put('/api/vision/hello/key_projects/disk')
            .end((err, res) => {
                assert.equal(400, res.status)
                done();
            });

    });

    it('shall return 400 if project name is invalid', (done) => {
        visionSupport.postNewVision(visionSupport.visionAPMChef)
            .then(() => {
                chai
                    .request(app)
                    .put('/api/vision/' + visionSupport.visionAPMChef.name + '/key_projects/invalid')
                    .end((err, res) => {
                        assert.equal(400, res.status);
                        assert.equal(res.body.note, 'The project blueprint specified is incorrect')
                        done();
                    });
            })


    });
    it('shall add project blueprint into vision if vision name is valid', (done) => {
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return visionSupport.PutKeyProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then((res) => {


                assert.equal(200, res.status);
                assert.equal(res.body.result, 'ok')
                visionModel
                    .findOne({ name: visionSupport.visionAPMChef.name })
                    .then(query => {
                        assert.equal(query.key_projects.length, 1);
                        done();
                    });


            });
    });
    it('shall return 400 if vision name is invalid when putting against  /vision/:vision_name/registry', (done) => {
        visionSupport.PutRegistryMachine1()
            .then((res) => {
                assert(false, 'it shall give 400 error this time')
                done();
            })
            .catch((res) => {
                assert.equal(res.status, 400);
                done();
            })
    });
    it('shall create a new registry or delete new registry', done => {
        visionSupport.postNewVision(visionSupport.visionAPMChef)
            .then(visionSupport.PutRegistryMachine1)
            .then(visionSupport.PutRegistryMachine2)
            .then(() => {
                visionModel.findOne({ name: visionSupport.visionAPMChef.name })
                    .exec((err, vision) => {
                        if (err) assert(false, err);
                        assert.equal(vision.registry.length, 1);
                        assert.equal(vision.registry[0].value, visionSupport.registryMachineName2.value);
                        done();
                    });
            })
            .catch((err) => {
                assert(false, err)
                done();
            })
    });

    it('shall create a new empty blueprint schedule with /vision/:vision_name/project_schedule/blueprint/:blueprint', done => {
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return visionSupport.PutBlueprintSchedule(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name)
            })
            .then(() => {
                visionModel.findOne({ name: visionSupport.visionAPMChef.name })
                    .populate('project_schedule.project_blueprint')
                    .exec((err, vision) => {
                        if (err) {
                            assert(false, 'incorrect response');
                            done();
                        }
                        else {
                            assert.equal(vision.project_schedule[0].project_blueprint.name, projectSupport.projectAPMPrestaging.name);
                            assert.equal(vision.project_schedule[0].server_ask, 1);
                            assert.equal(vision.project_schedule[0].machine_demand.length, 0);
                            done();
                        }
                    });
            })
    });
    it('shall return 400 error when blueprint is inalid with /vision/:vision_name/project_schedule/blueprint/:blueprint', done => {
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return visionSupport.PutBlueprintSchedule(visionSupport.visionAPMChef.name, 'invalid blueprint')
            })
            .then(() => {
                assert(false,'it shall return 400 error')
                done();
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                done();               
            })
    });

    it('shall specify server ask with /vision/:vision_name/project_schedule/blueprint/:blueprint/server_ask/:ask/group/:group', (done) => {
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return visionSupport.putBlueprintServerAsk(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, 5)
            })
            .then(() => {
                visionModel.findOne({ name: visionSupport.visionAPMChef.name })
                    .populate('project_schedule.project_blueprint')
                    .exec((err, vision) => {
                        if (err) {
                            assert(false, 'incorrect response');
                            done();
                        }
                        else {
                            assert.equal(vision.project_schedule[0].server_ask, 5);
                            done();
                        }
                    });
            })
    });
    it('shall specify server ask when hit it for 100 timeswith /vision/:vision_name/project_schedule/blueprint/:blueprint/server_ask/:ask/group/:group', (done) => {
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                let taskList=[];
                for(let i=0;i<100;i++){
                    taskList.push(visionSupport.putBlueprintServerAsk(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, i));
                }
                return Promise.all(taskList);
                
            })
            .then(() => {
                visionModel.findOne({ name: visionSupport.visionAPMChef.name })
                    .populate('project_schedule.project_blueprint')
                    .exec((err, vision) => {
                        if (err) {
                            assert(false, 'incorrect response');
                            done();
                        }
                        else {
                            assert.equal(vision.project_schedule.length, 1);
                            done();
                        }
                    });
            })
    });    
    it('shall return error for invalid blueprint name with /vision/:vision_name/project_schedule/blueprint/:blueprint/server_ask/:ask/group/:group', (done) => {
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return visionSupport.putBlueprintServerAsk(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging1.name, 5)
            })
            .then(() => {
                assert(false,'shall return error for this');
                done();                

            })
            .catch((err)=>{
                assert.equal(err.err.status,400)
                done();
            })
    });
    
    it('shall update specified machine ask with /vision/:vision_name/project_schedule/blueprint/:blueprint/machine/:machine/ask/:ask/group/:group', done => {
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 5,[{vid:"s1",group_number:1}]);
            })
            .then(() => {
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 4,[{vid:"s1",group_number:2},{vid:"s3",group_number:1}]);
            })
            .then(() => {
                visionModel.findOne({ name: visionSupport.visionAPMChef.name })
                    .populate('project_schedule.machine_demand.dorm')
                    .exec((err, vision) => {
                        if (err) {
                            assert(false, 'incorrect response');
                            done();
                        }
                        else {
                            assert.equal(vision.project_schedule[0].machine_demand[0].instance, 4);
                            assert.equal(vision.project_schedule[0].machine_demand[0].vid_list[0].group_number, 2);
                            assert.equal(vision.project_schedule[0].machine_demand[0].vid_list[0].vid, 's1');
                            assert.equal(vision.project_schedule[0].machine_demand[0].vid_list[1].group_number, 1);
                            done();
                        }
                    });
            })
    });
    it('shall return error 400 for invalid machine name /vision/:vision_name/project_schedule/blueprint/:blueprint/machine/:machine/ask/:ask/group/:group', done => {
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 5);
            })
            .then(() => {
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, 'invalid machine name', 4);
            })
            .then(() => {
                assert(false,'shall return error 400');
                done();
            })
            .catch(err=>{
                assert.equal(err.err.status,400)
                done();
            });
    });

    it('shall specify machine ask with /vision/:vision_name/project_schedule/blueprint/:blueprint/machine/:machine/ask/:ask/group/:group', done => {

        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 5);
            })
            .then(() => {
                visionModel.findOne({ name: visionSupport.visionAPMChef.name })
                    .populate('project_schedule.machine_demand.dorm')
                    .exec((err, vision) => {
                        if (err) {
                            assert(false, 'incorrect response');
                            done();
                        }
                        else {
                            assert.equal(vision.project_schedule[0].machine_demand[0].instance, 5);
                            done();
                        }
                    });
            })

    });

    it('shall add append project into project list with /vision/:vision_name/project_schedule/blueprint/:blueprint/next/:next', done => {
        
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(projectSupport.postProjectBlueprintAESPrestaging1)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, projectSupport.projectAPMPrestaging1.name);
            })
            .then(() => {
                visionModel.findOne({ name: visionSupport.visionAPMChef.name })
                    .populate('project_schedule.machine_demand.dorm')
                    .populate('project_schedule.project_blueprint')
                    .populate('project_schedule.next_project.blueprint')
                    .exec((err, vision) => {
                        if (err) {
                            assert(false, 'incorrect response');
                            done();
                        }
                        else {
                            assert.equal(vision.project_schedule[0].next_project[0].blueprint.name, projectSupport.projectAPMPrestaging1.name);
                            done();
                        }
                    });
            })

    });
    it('shall add append project into project list with /vision/:vision_name/project_schedule/blueprint/:blueprint/next/:next', done => {
        
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(projectSupport.postProjectBlueprintAESPrestaging1)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                let taskList=[];
                for(let i=0;i<20;i++){
                    taskList.push(visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, projectSupport.projectAPMPrestaging1.name));
                }
                return Promise.all(taskList);
            })
            .then(() => {
                visionModel.find({ name: visionSupport.visionAPMChef.name })
                    .populate('project_schedule.machine_demand.dorm')
                    .populate('project_schedule.project_blueprint')
                    .populate('project_schedule.next_project.blueprint')
                    .exec((err, visionList) => {
                        
                        if (err) {
                            assert(false, 'incorrect response');
                            done();
                        }
                        else {
                            assert.equal(visionList[0].project_schedule[0].next_project.length,1);
                            done();
                        }
                    });
            })

    });    
    it('shall throw error when initial blueprint is invlaid list with /vision/:vision_name/project_schedule/blueprint/:blueprint/next/:next',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAESPrestaging1)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, projectSupport.projectAPMPrestaging1.name);
            })
            .then(()=>{
                assert(false,'error should be thrown as initial blueprint is invalid')
                done();
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                done();
            });
    });
    it('shall throw error when next blueprint is invlaid list with /vision/:vision_name/project_schedule/blueprint/:blueprint/next/:next',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)        
            .then(() => {
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, projectSupport.projectAPMPrestaging1.name);
            })   
            .then(()=>{
                assert(false,'error should be thrown as initial blueprint is invalid')
                done();
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                done();
            });                     
    });

    it('shall go to next task for specific project /vision/:vision_name/current_projects/:project_id/next_task',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                return visionSupport.putNextTask(visionSupport.visionAPMChef.name,projectRes.body.projectId)
            })
            .then((result)=>{
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate({
                            path:'current_projects._project',
                            model:'Project',
                            populate:{
                                path:'pending_tasks.task',
                                model:'Task'
                            }
                        })
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,err);
                            done();
                        }
                        else{
                            assert.equal(vision.current_projects[0]._project.pending_tasks.length,1);
                            assert.equal(vision.current_projects[0]._project.pending_tasks[0].task.name,taskSupport.taskAPMInstall.name);
                            done();
                        }
                    });
            })
            .catch(()=>{
                assert(false,'it shall not throw error');
                done();
            });
    });
    it('shall not throw error when there is 0 task in the list /vision/:vision_name/current_projects/:project_id/next_task',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                visionSupport.putNextTask(visionSupport.visionAPMChef.name,projectRes.body.projectId)
                .then(()=>{
                    return visionSupport.putNextTask(visionSupport.visionAPMChef.name,projectRes.body.projectId)
                })
                .then(()=>{
                    return visionSupport.putNextTask(visionSupport.visionAPMChef.name,projectRes.body.projectId)
                })
                .then(()=>{
                    return visionSupport.putNextTask(visionSupport.visionAPMChef.name,projectRes.body.projectId)
                })                                
                .then(()=>{
                    visionModel.findOne({name:visionSupport.visionAPMChef.name})
                        .populate('current_projects._project')
                        .exec((err,vision)=>{
                            if(err){
                                assert(false,err);
                                done();
                            }
                            else{
                                assert.equal(vision.current_projects[0]._project.pending_tasks.length,0);
                                done();
                            }
                        });
                })
                .catch((done)=>{
                    assert(false,'it shall not throw error');
                    done();
                });                
            })
                                             

    });
    it('shall throw 400 error when vision is invalid /vision/:vision_name/current_projects/:project_id/next_task',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                return visionSupport.putNextTask('invalid vision',projectRes.body.projectId)
            })
            .then((result)=>{
                assert(false,'it shall throw error');
            })
            .catch((res)=>{
                assert.equal(res.res.status,400);
                done();
            });
    });
    it('shall throw 400 error when project id is invalid /vision/:vision_name/current_projects/:project_id/next_task',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                return visionSupport.putNextTask(visionSupport.visionAPMChef.name,'invalid id')
            })
            .then((result)=>{
                assert(false,'it shall throw error');
            })
            .catch((res)=>{
                assert.equal(res.res.status,400);
                done();
            });
    });

    it('shall update host name /vision/:vision_name/current_projects/:project_id/host/:hostName',done=>{
        taskSupport.postTaskAPMNewMediaDetection()            
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                return visionSupport.putProjectHost(visionSupport.visionAPMChef.name,projectRes.body.projectId,dormSupport.dorm1.name);
            })
            .then((result)=>{
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate({
                            path:'current_projects._project',
                            model:'Project',
                            populate:[{
                                path:'pending_tasks.task',
                                model:'Task'
                            },
                            {
                                path:'host',
                                model:'Dorm'
                            }]
                        })
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,err);
                            done();
                        }
                        else{                            
                            assert.equal(vision.current_projects[0]._project.host.name,dormSupport.dorm1.name);
                            done();
                        }
                    });
            })
            .catch(()=>{
                assert(false,'it shall not throw error');
                done();
            });        
    });
    it('shall throw 400 error when vision name is invalid /vision/:vision_name/current_projects/:project_id/host/:hostName',done=>{
        taskSupport.postTaskAPMNewMediaDetection()            
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                // return visionSupport.putProjectHost(visionSupport.visionAPMChef.name,projectRes.body.projectId,dormSupport.dorm1.name);
                return visionSupport.putProjectHost('invalid vision name',projectRes.body.projectId,dormSupport.dorm1.name);
            })
            .then((result)=>{
                assert(false,'it shall throw error 400')
                done();
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                done();
            });        
    });
    it('shall throw 400 error when host name is invalid /vision/:vision_name/current_projects/:project_id/host/:hostName',done=>{
        taskSupport.postTaskAPMNewMediaDetection()            
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                 return visionSupport.putProjectHost(visionSupport.visionAPMChef.name,'invalid dorm');
                
            })
            .then((result)=>{
                assert(false,'it shall throw error 400')
                done();
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                done();
            });        
    });

    it('shall update host status  /vision/:vision_name/current_projects/:project_id/status/:status',done=>{
        taskSupport.postTaskAPMNewMediaDetection()            
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                return visionSupport.putProjectStatus(visionSupport.visionAPMChef.name,projectRes.body.projectId,projectStatus.waitingForScheduling.id);                
            })
            .then((result)=>{
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate({
                            path:'current_projects._project',
                            model:'Project',
                            populate:[{
                                path:'pending_tasks.task',
                                model:'Task'
                            },
                            {
                                path:'host',
                                model:'Dorm'
                            }]
                        })
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,err);
                            done();
                        }
                        else{                            
                            assert.equal(vision.current_projects[0]._project.status,projectStatus.waitingForScheduling.id);
                            done();
                        }
                    });
            })
            .catch(()=>{
                assert(false,'it shall not throw error');
                done();
            });  
    });
    it('shall throw 400 error when vision name is invalid /vision/:vision_name/current_projects/:project_id/status/:status',done=>{
        taskSupport.postTaskAPMNewMediaDetection()            
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                //return visionSupport.putProjectStatus(visionSupport.visionAPMChef.name,projectRes.body.projectId,projectStatus.waitingForScheduling.id);                
                return visionSupport.putProjectStatus('invalid vision name',projectRes.body.projectId,projectStatus.waitingForScheduling.id);
            })
            .then((result)=>{
                assert(false,'it shall throw error');
                done();
            })
            .catch((err)=>{
                assert(err.err.status,400);
                done();
            });  
    });
    it('shall throw 400 error when status is invalid /vision/:vision_name/current_projects/:project_id/status/:status',done=>{
        taskSupport.postTaskAPMNewMediaDetection()            
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm1);
            })
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                return visionSupport.putProjectStatus(visionSupport.visionAPMChef.name,'invalid project id',projectStatus.waitingForScheduling.id);                
                
            })
            .then((result)=>{
                assert(false,'it shall throw error');
                done();
            })
            .catch((err)=>{
                assert(err.err.status,400);
                done();
            });  
    });

});

describe('/delete',()=>{
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
    it('shall delete key projects with /vision/:vision_name/key_projects/:projectName',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return visionSupport.PutKeyProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                return visionSupport.deleteKeyProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)                
            })
            .then(()=>{
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,err);
                            done();
                        }
                        else{
                            assert.equal(vision.key_projects.length,0);
                            done();
                        }
                    })
            });
    });
    it('shall throw 400 error when vision name is invalid vision/:vision_name/key_projects/:projectName',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return visionSupport.PutKeyProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                return visionSupport.deleteKeyProject('invalid vision',projectSupport.projectAPMPrestaging.name)                
            })
            .then(()=>{
                assert(false,'vision name is invalid, it shall return error 400');
            })
            .catch(err=>{
                assert.equal(err.err.status,400)
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,err);
                            done();
                        }
                        else{
                            assert.equal(vision.key_projects.length,1);
                            done();
                        }
                    });        
                
            });
    });
    it('shall throw 400 error when projectname is invalid /vision/:vision_name/key_projects/:projectName',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return visionSupport.PutKeyProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                return visionSupport.deleteKeyProject(visionSupport.visionAPMChef.name,'invalid project name')                
            })
            .then(()=>{
                assert(false,'vision name is invalid, it shall return error 400');
            })
            .catch(err=>{
                assert.equal(err.err.status,400)
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,err);
                            done();
                        }
                        else{
                            assert.equal(vision.key_projects.length,1);
                            done();
                        }
                    });
            });
    });

    it('shall delete project in current project /vision/:vision_name/current_projects/:projectId',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                return visionSupport.deleteCurrentProject(visionSupport.visionAPMChef.name,projectRes.body.projectId)
            })
            .then((result)=>{
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate([{
                            path:'current_projects._project',
                            model:'Project',
                            populate:{
                                path:'pending_tasks.task',
                                model:'Task'
                            }
                        }])
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,err);
                            done();
                        }
                        else{
                            assert.equal(vision.current_projects.length,0);
                            //assert.equal(vision.current_projects[0]._project.pending_tasks[0].task.name,taskSupport.taskAPMInstall.name);
                            done();
                        }
                    });
            })
            .catch(()=>{
                assert(false,'it shall not throw error');
                done();
            });

    })
    it('shall report 400 error if projectid is invalid /vision/:vision_name/current_projects/:projectId',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                //return visionSupport.deleteCurrentProject(visionSupport.visionAPMChef.name,projectRes.body.projectId)
                return visionSupport.deleteCurrentProject('invalid vision name',projectRes.body.projectId)
            })
            .then((result)=>{
                assert(false,'it shall throw 400 error')
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate([{
                            path:'current_projects._project',
                            model:'Project',
                            populate:{
                                path:'pending_tasks.task',
                                model:'Task'
                            }
                        }])
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,err);
                            done();
                        }
                        else{
                            assert.equal(vision.current_projects.length,1);
                            //assert.equal(vision.current_projects[0]._project.pending_tasks[0].task.name,taskSupport.taskAPMInstall.name);
                            done();
                        }
                    });



            });

    })
    it('shall report 400 error if vision is invalid /vision/:vision_name/current_projects/:projectId',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                return visionSupport.deleteCurrentProject(visionSupport.visionAPMChef.name,'invalid id')
                
            })
            .then((result)=>{
                assert(false,'it shall throw 400 error')
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate([{
                            path:'current_projects._project',
                            model:'Project',
                            populate:{
                                path:'pending_tasks.task',
                                model:'Task'
                            }
                        }])
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,err);
                            done();
                        }
                        else{
                            assert.equal(vision.current_projects.length,1);
                            //assert.equal(vision.current_projects[0]._project.pending_tasks[0].task.name,taskSupport.taskAPMInstall.name);
                            done();
                        }
                    });



            });

    })

    it('shall delete blueprint schedule /vision/:vision_name/project_schedule/:blueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                //initialize blueprint schedule
                return visionSupport.PutBlueprintSchedule(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                return visionSupport.deleteProjectSchedule(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then((result)=>{
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate([{
                            path:'current_projects._project',
                            model:'Project',
                            populate:{
                                path:'pending_tasks.task',
                                model:'Task'
                            }
                        }])
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,err);
                            done();
                        }
                        else{
                            assert.equal(vision.project_schedule.length,0);
                            //assert.equal(vision.current_projects[0]._project.pending_tasks[0].task.name,taskSupport.taskAPMInstall.name);
                            done();
                        }
                    });
            })
            .catch(()=>{
                assert(false,'it shall not throw error');
                done();
            });

    })

    it('shall throw 400 error when blueprint is invalid /vision/:vision_name/project_schedule/:blueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                //initialize blueprint schedule
                return visionSupport.PutBlueprintSchedule(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                return visionSupport.deleteProjectSchedule(visionSupport.visionAPMChef.name,'projectSupport.projectAPMPrestaging.name');
            })
            .then((result)=>{
                assert(false,'it shall throw error');
                done();
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate([{
                            path:'current_projects._project',
                            model:'Project',
                            populate:{
                                path:'pending_tasks.task',
                                model:'Task'
                            }
                        }])
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,err);
                            done();
                        }
                        else{
                            assert.equal(vision.project_schedule.length,1);
                            //assert.equal(vision.current_projects[0]._project.pending_tasks[0].task.name,taskSupport.taskAPMInstall.name);
                            done();
                        }
                    });                
                

            });

    })
    it('shall throw 400 error if vision is invalid /vision/:vision_name/project_schedule/:blueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(()=>{
                return visionSupport.postNewProject(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name)
            })            
            .then((projectRes)=>{
                //initialize blueprint schedule
                return visionSupport.PutBlueprintSchedule(visionSupport.visionAPMChef.name,projectSupport.projectAPMPrestaging.name);
            })
            .then(()=>{
                return visionSupport.deleteProjectSchedule('visionSupport.visionAPMChef.name',projectSupport.projectAPMPrestaging.name);
            })
            .then((result)=>{
                assert(false,'it shall throw error');
                done();
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                visionModel.findOne({name:visionSupport.visionAPMChef.name})
                    .populate([{
                            path:'current_projects._project',
                            model:'Project',
                            populate:{
                                path:'pending_tasks.task',
                                model:'Task'
                            }
                        }])
                    .exec((err,vision)=>{
                        if(err){
                            assert(false,err);
                            done();
                        }
                        else{
                            assert.equal(vision.project_schedule.length,1);
                            //assert.equal(vision.current_projects[0]._project.pending_tasks[0].task.name,taskSupport.taskAPMInstall.name);
                            done();
                        }
                    });                
                

            });

    })

    it('shall delete dorm  /vision/:vision_name/project_schedule/:blueprint/machine_demand/:dorm',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 5);
            })
            .then(()=>{
                return visionSupport.deleteDormInProjectSchedule(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name)
            })
            .then(()=>{
                visionModel.find({name:visionSupport.visionAPMChef.name})
                    .exec((err,vision)=>{
                        assert.equal(vision[0].project_schedule[0].machine_demand.length,0);
                        done();
                    });
            })
            .catch(err=>{
                assert(false,`it shall not return error ${err}`)
                done();

            });
    })
    it('shall return 400 error when blueprint is invalid /vision/:vision_name/project_schedule/:blueprint/machine_demand/:dorm',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 5);
            })
            .then(()=>{
                return visionSupport.deleteDormInProjectSchedule('visionSupport.visionAPMChef.name', projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name)
            })
            .then(()=>{
                assert(false,`it shall return error 400`)
                done();

            })
            .catch(err=>{
                
                assert(err.err.status,400);
                visionModel.find({name:visionSupport.visionAPMChef.name})
                    .exec((err,vision)=>{
                        assert.equal(vision[0].project_schedule[0].machine_demand.length,1);
                        done();
                    });

            });
    })
    it('shall return 400 error when dorm is invalid /vision/:vision_name/project_schedule/:blueprint/machine_demand/:dorm',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 5);
            })
            .then(()=>{
                return visionSupport.deleteDormInProjectSchedule(visionSupport.visionAPMChef.name, 'projectSupport.projectAPMPrestaging.name', dormSupport.dorm1.name)
            })
            .then(()=>{
                assert(false,`it shall return error 400`)
                done();

            })
            .catch(err=>{
                
                assert(err.err.status,400);
                visionModel.find({name:visionSupport.visionAPMChef.name})
                    .exec((err,vision)=>{
                        assert.equal(vision[0].project_schedule[0].machine_demand.length,1);
                        done();
                    });

            });
    })
    it('shall return 400 error when vision is invalid /vision/:vision_name/project_schedule/:blueprint/machine_demand/:dorm',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 5);
            })
            .then(()=>{
                return visionSupport.deleteDormInProjectSchedule(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, 'dormSupport.dorm1.name')
            })
            .then(()=>{
                assert(false,`it shall return error 400`)
                done();

            })
            .catch(err=>{
                
                assert(err.err.status,400);
                visionModel.find({name:visionSupport.visionAPMChef.name})
                    .exec((err,vision)=>{
                        assert.equal(vision[0].project_schedule[0].machine_demand.length,1);
                        done();
                    });

            });
    })

    it('shall delete nextBlueprint /vision/:vision_name/project_schedule/:blueprint/next/:nextBlueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(projectSupport.postProjectBlueprintAESPrestaging1)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, projectSupport.projectAPMPrestaging1.name);
            })
            .then(()=>{
                return visionSupport.deleteNextBlueprintInProjectSchedule(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, projectSupport.projectAPMPrestaging1.name)
            })
            .then(()=>{
                visionModel.find({name:visionSupport.visionAPMChef.name})
                    .exec((err,vision)=>{
                        assert.equal(vision[0].project_schedule[0].next_project.length,0);
                        done();
                    });
            })
            .catch(()=>{
                assert(false,`it shall not return error`)
                done();
            })

    })
    it('shall throw 400 error when  blueprint is invlaid /vision/:vision_name/project_schedule/:blueprint/next/:nextBlueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(projectSupport.postProjectBlueprintAESPrestaging1)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, projectSupport.projectAPMPrestaging1.name);
            })
            .then(()=>{
                return visionSupport.deleteNextBlueprintInProjectSchedule(visionSupport.visionAPMChef.name, 'projectSupport.projectAPMPrestaging.name', projectSupport.projectAPMPrestaging1.name)
            })
            .then(()=>{
                assert(false,`it shall not return error`)
                done();
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                visionModel.find({name:visionSupport.visionAPMChef.name})
                    .exec((err,vision)=>{
                        assert.equal(vision[0].project_schedule[0].next_project.length,1);
                        done();
                    });                

            })

    })
    it('shall throw 400 error when nextblueprint is invalid /vision/:vision_name/project_schedule/:blueprint/next/:nextBlueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(projectSupport.postProjectBlueprintAESPrestaging1)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, projectSupport.projectAPMPrestaging1.name);
            })
            .then(()=>{
                return visionSupport.deleteNextBlueprintInProjectSchedule(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, 'projectSupport.projectAPMPrestaging1.name')
            })
            .then(()=>{
                assert(false,`it shall not return error`)
                done();
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                visionModel.find({name:visionSupport.visionAPMChef.name})
                    .exec((err,vision)=>{
                        assert.equal(vision[0].project_schedule[0].next_project.length,1);
                        done();
                    });                

            })

    })
    it('shall throw 400 error when vision name is invalid /vision/:vision_name/project_schedule/:blueprint/next/:nextBlueprint',done=>{
        taskSupport.postTaskAPMNewMediaDetection()
            .then(taskSupport.posttaskAPMInstall)
            .then(projectSupport.postProjectBlueprintAPMPrestaging)
            .then(projectSupport.postProjectBlueprintAESPrestaging1)
            .then(visionSupport.PostVisionAPMChef)
            .then(() => {
                return dormSupport.PostDorm(dormSupport.dorm1)
            })
            .then(() => {
                return visionSupport.putNextBlueprint(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, projectSupport.projectAPMPrestaging1.name);
            })
            .then(()=>{
                return visionSupport.deleteNextBlueprintInProjectSchedule('visionSupport.visionAPMChef.name', projectSupport.projectAPMPrestaging.name, projectSupport.projectAPMPrestaging1.name)
            })
            .then(()=>{
                assert(false,`it shall not return error`)
                done();
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                visionModel.find({name:visionSupport.visionAPMChef.name})
                    .exec((err,vision)=>{
                        assert.equal(vision[0].project_schedule[0].next_project.length,1);
                        done();
                    });                

            })

    })

})
