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
        visionModel.remove({}, (err) => {
            done();
        })
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
            .then(() => {
                chai
                    .request(app)
                    .put(`/api/vision/${visionSupport.visionAPMChef.name}/key_projects/${projectSupport.projectAPMPrestaging.name}`)
                    .end((err, res) => {
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

    it('shall specify server ask with /vision/:vision_name/project_schedule/blueprint/:blueprint/server_ask/:ask', (done) => {
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
    it('shall return error for invalid blueprint name with /vision/:vision_name/project_schedule/blueprint/:blueprint/server_ask/:ask', (done) => {
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

    it('shall update specified machine ask with /vision/:vision_name/project_schedule/blueprint/:blueprint/machine/:machine/ask/:ask', done => {
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
                return visionSupport.putBlueprintMachineInstance(visionSupport.visionAPMChef.name, projectSupport.projectAPMPrestaging.name, dormSupport.dorm1.name, 4);
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
                            done();
                        }
                    });
            })
    });
    it('shall return error 400 for invalid machine name /vision/:vision_name/project_schedule/blueprint/:blueprint/machine/:machine/ask/:ask', done => {
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

    it('shall specify machine ask with /vision/:vision_name/project_schedule/blueprint/:blueprint/machine/:machine/ask/:ask', done => {

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

});

describe('/delete',()=>{
    
    it('shall delete key projects with /vision/:vision_name/key_projects/:projectName');
    it('shall throw 400 error when vision name is invalid vision/:vision_name/key_projects/:projectName')
    it('shall throw 400 error when projectname is invalid /vision/:vision_name/key_projects/:projectName');

    it('shall delete project in current project /vision/:vision_name/current_projects/:projectId')
    it('shall report 400 error if projectid is invalid /vision/:vision_name/current_projects/:projectId')
    it('shall report 400 error if vision is invalid /vision/:vision_name/current_projects/:projectId')

    it('shall delete blueprint schedule /vision/:vision_name/project_schedule/:blueprint')
    it('shall throw 400 error when blueprint is invalid /vision/:vision_name/project_schedule/:blueprint')
    it('shall throw 400 error if vision is invalid /vision/:vision_name/project_schedule/:blueprint')

    it('shall delete dorm  /vision/:vision_name/project_schedule/:blueprint')
    it('shall return 400 error when blueprint is invalid /vision/:vision_name/project_schedule/:blueprint')
    it('shall return 400 error when dorm is invalid /vision/:vision_name/project_schedule/:blueprint')
    it('shall return 400 error when vision is invalid')
    
    it('shall delete nextBlueprint /vision/:vision_name/project_schedule/:blueprint/next/:nextBlueprint')
    it('shall throw 400 error when  blueprint is invlaid /vision/:vision_name/project_schedule/:blueprint/next/:nextBlueprint')
    it('shall throw 400 error when nextblueprint is invalid /vision/:vision_name/project_schedule/:blueprint/next/:nextBlueprint')
    it('shall throw 400 error when vision name is invalid /vision/:vision_name/project_schedule/:blueprint/next/:nextBlueprint')

})
