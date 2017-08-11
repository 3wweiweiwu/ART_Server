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
});

describe('/put',()=>{
    before((done)=>{
        dormModel.remove({},(err)=>{});
        done();
    });
    let dorm1={
        name:"test_dorm1",
        system_resource:{
            CPU:38,
            total_memory_mb:4096,
            free_memory_mb:3081,
            disk_total:[
                {
                    drive_letter:"c",
                    total_disk_space_mb:9096,
                    free_disk_space_mb:3084
                },
                {
                    drive_letter:"d",
                    total_disk_space_mb:19096,
                    free_disk_space_mb:33084
                }
            ]
        }
    };    
    it('shall response error when updating non-existing server',(done)=>{
        chai
        .request(app)
        .put("/api/dorm")
        .send(dorm1)
        .end((err,res)=>{
            res.should.have.status(500);
            res.body.should.have.property("ERR");
            done();    
        });
        
    });
});