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
chai.use(chaiHttp);

const postNewBlueprint=(query,cb=()=>{})=>{
    return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .post('/api/projectBlueprint')
        .send(query)
        .end((err, res) => {
            console.log();
            if(err) {
                reject(err);
                return cb(err)
            }
            else {
                resolve(res);
                return cb(null,res)
            }
        });   
    })
}

const projectAPMPrestaging={
    name:'APM_Prestaging',
    note:"Install APM media whenever it is posted",
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSpec.APMDetection.name,taskSpec.APMInstall.name],
    next:[]
}

const projectAPMPrestaging1={
    name:'APM_Prestaging1',
    note:"Install APM media whenever it is posted",
    memory_usage_mb:10*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSpec.APMDetection.name,taskSpec.APMInstall.name],
    next:[]
}
const projectAPMPrestaging_Override={
    name:'APM_Prestaging',
    note:"When latest media is posted, install media",
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSpec.APMDetection.name,taskSpec.APMInstall.name],
    next:[]
}

const projectAPMPrestaging_Invalid={
    name:'APM_Prestaging',
    note:"When latest media is posted, install media",
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:['taskSpec.APMDetection.name,taskSpec.APMInstall.name'],
    next:[]
}
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
                //validate database and ensure blueprint object is what we want
                projectBlueprintModel
                .findOne({name:projectAPMPrestaging.name})
                .populate('tasks.task')
                .exec((err,blueprint)=>{
                    assert.equal(blueprint.tasks[0].task.name,projectAPMPrestaging.tasks[0]);
                    assert.equal(blueprint.tasks[1].task.name,projectAPMPrestaging.tasks[1]);
                    assert.equal(blueprint.name,projectAPMPrestaging.name);                                        
                    cb();
                    done();
                });
            }

        ]);

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