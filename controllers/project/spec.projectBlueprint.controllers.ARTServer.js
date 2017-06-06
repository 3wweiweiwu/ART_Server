process.env.NODE_ENV = 'test';
let async = require('async');
const EventEmitter = require('events');
let app = require('../../app.js');
var assert = require('assert');
var projectBlueprintModel=require('../../model/project/projectBlueprint.model.ARTServer');
var taskSpec=require('../task/spec.task.controllers.ARTServer')
var taskModel = require('../../model/task/task.model.ARTServer.js');
var taskImageDeployment=require('../../model/task/imageDeploy.model.ARTServer');
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let support=require('./support.project.ARTServer')

chai.use(chaiHttp);

const postNewBlueprint=support.PostNewBlueprint;

const projectAPMPrestaging=support.projectAPMPrestaging;

const projectAPMPrestaging1=support.projectAPMPrestaging1;

const projectAPMPrestaging_Override=support.projectAPMPrestaging_Override;

const projectAPMPrestaging_Invalid=support.projectAPMPrestaging_Invalid;

describe('blueprint - /post',()=>{
    beforeEach((done) => {
        taskModel.remove({}, (err) => { 
            taskImageDeployment.remove({},(err)=>{
                projectBlueprintModel.remove({},(err)=>{
                    done();
                })
                
            })
            
        });    
    })
    it('shall create a new blueprint when there is blank database',(done)=>{
        async.series([
            function(cb){
                //post task 1
                taskSpec.PostTask(taskSpec.APMDetection)
                .then(()=>{cb();})
            },
            
            function(cb){
                //post task 2
                taskSpec.PostTask(taskSpec.APMInstall,()=>{
                    cb();
                })                
            },
            function(cb){
                //post blue print
                postNewBlueprint(projectAPMPrestaging)
                .then(()=>{cb();})
            },
            function(cb){
                //update blueprint and test override
                postNewBlueprint(projectAPMPrestaging_Override,()=>{
                    cb();
                });
            },
            function(cb){
                //validate database and ensure blueprint object is what we want
                projectBlueprintModel
                .find({name:projectAPMPrestaging.name})
                .populate('tasks.task')
                .exec((err,blueprintList)=>{
                    assert.equal(blueprintList.length,1);
                    let blueprint=blueprintList[0];
                    assert.equal(blueprint.note,projectAPMPrestaging_Override.note);                                        
                    cb();
                    done();
                });
            }

        ]);

    });
    it('shall override when there is existing record in the database',(done)=>{
        taskSpec.PostTask(taskSpec.APMDetection)
        .then(()=>{
            return taskSpec.PostTask(taskSpec.APMInstall);
        })
        .then(()=>{
            return postNewBlueprint(projectAPMPrestaging);
        })
        .then(()=>{
            projectBlueprintModel
            .findOne({name:projectAPMPrestaging.name})
            .populate('tasks.task')
            .exec((err,blueprint)=>{

                assert(blueprint.tasks[0].task.name==projectAPMPrestaging.tasks[0]||blueprint.tasks[0].task.name==projectAPMPrestaging.tasks[1]);
                
                
                
                done();           
            }); 
        });
    });
    it('shall return status 400 when invalid task is passed in',(done)=>{
                
        async.series([
            function(cb){
                //post task 1
                taskSpec.PostTask(taskSpec.APMDetection)
                .then(()=>{cb();})
            },            
            function(cb){
                //post task 2
                taskSpec.PostTask(taskSpec.APMInstall,()=>{
                    cb();
                })                
            },
            function(cb){
                //post blue print
                postNewBlueprint(projectAPMPrestaging_Invalid)
                .catch((err)=>{                    
                    assert.equal(err.status,400);
                    cb();
                    done();
                });
            }

        ]);
        
    });
});

describe('blueprint -/get',()=>{
    it('shall return nothing when project base is empty',(done)=>{
        chai
        .request(app)
        .get('/api/projectBlueprint')        
        .end((err, res) => {
            assert.equal(res.body.length,0);
            done();
        });   
    })
    it('shall return all tasks when passed /get',(done)=>{

        async.series([
            function(cb){
                //post task 1
                taskSpec.PostTask(taskSpec.APMDetection)
                .then(()=>{cb();})
            },            
            function(cb){
                //post task 2
                taskSpec.PostTask(taskSpec.APMInstall,()=>{
                    cb();
                })                
            },
            function(cb){
                //post blue print
                postNewBlueprint(projectAPMPrestaging)
                .then((err)=>{                    
                    
                    cb();
                    
                });
            },
            function(cb){
                //post blue print 1
                postNewBlueprint(projectAPMPrestaging1)
                .then((err)=>{                    
                    
                    cb();
                    
                });
            },
            function(cb){
                //validate that we have 2 items
                chai
                .request(app)
                .get('/api/projectBlueprint')        
                .end((err, res) => {
                    assert.equal(res.body.length,2);
                    assert.equal(res.body[1].name,projectAPMPrestaging1.name);
                    done();
                    cb();
                });                 
            }

        ]);

    });
    it('shall return specific task when pass /get/name',(done)=>{

        async.series([
            function(cb){
                //post task 1
                taskSpec.PostTask(taskSpec.APMDetection)
                .then(()=>{cb();})
            },            
            function(cb){
                //post task 2
                taskSpec.PostTask(taskSpec.APMInstall,()=>{
                    cb();
                })                
            },
            function(cb){
                //post blue print
                postNewBlueprint(projectAPMPrestaging)
                .then((err)=>{                    
                    
                    cb();
                    
                });
            },
            function(cb){
                //post blue print 1
                postNewBlueprint(projectAPMPrestaging1)
                .then((err)=>{                    
                    
                    cb();
                    
                });
            },
            function(cb){
                //validate that we have 2 items
                chai
                .request(app)
                .get('/api/projectBlueprint/'+projectAPMPrestaging1.name)        
                .end((err, res) => {
                    assert.equal(res.body.length,1);
                    assert.equal(res.body[0].name,projectAPMPrestaging1.name);
                    done();
                    cb();
                });                 
            }

        ]);
        
    });
    
});

exports.PostNewBlueprint=function(query,cb=()=>{}){
    return postNewBlueprint(query,cb);
}
exports.project1=projectAPMPrestaging;
