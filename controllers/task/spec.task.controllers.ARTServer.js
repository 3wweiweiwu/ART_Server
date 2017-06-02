process.env.NODE_ENV = 'test';
let async = require('async');
const EventEmitter = require('events');
let app = require('../../app.js');
var assert = require('assert');
var taskModel = require('../../model/task/task.model.ARTServer.js');
var taskImageDeployment=require('../../model/task/imageDeploy.model.ARTServer');
let support=require('./support.Task.Controllers.ARTServer')
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
chai.use(chaiHttp);
const taskAPMInstall=support.taskAPMInstall;
const taskAPM_NewMediaDetection=support.taskAPM_NewMediaDetection;
const taskMissingNote=support.taskMissingNote;
exports.PostTask=support.PostTask



describe("task /post",()=>{
    
    beforeEach((done) => {
        taskModel.remove({}, (err) => { 
            taskImageDeployment.remove({},(err)=>{
                done()
            })
            
        });
    });
  

    it('shall give error when note is incomplete',(done)=>{
        chai
        .request(app)
        .post('/api/task')
        .send(taskMissingNote)
        .end((err, res) => {
            res.should.have.status(400);                    
            done()
        });        
    });
    it('shall create new record when setting_type is null',(done)=>{
        
        chai
        .request(app)
        .post('/api/task')
        .send(taskAPM_NewMediaDetection)
        .end((err, res) => {
            res.should.have.status(200);                    
            
            taskModel
            .findOne({name:taskAPM_NewMediaDetection.name})
            .exec((err,doc)=>{
                assert.equal(doc.name,taskAPM_NewMediaDetection.name);
                assert.equal(doc.note,taskAPM_NewMediaDetection.note);
                assert.equal(doc.task_script_path,taskAPM_NewMediaDetection.task_script_path);
                done();
            });
        });
    });
    it('shall create a new image deploy task when setting_type is Task.ImageDeploy',(done)=>{
        chai
            .request(app)
            .post('/api/task')
            .send(taskAPMInstall)
            .end((err, res) => {
                //status shall be 200
                res.should.have.status(200);                    
                //check if we can integrate these two files
                taskModel.findOne({name:taskAPMInstall.name})
                .populate('_settings')
                .exec((err,doc)=>{
                    assert.equal(doc._settings.memory_size_mb,taskAPMInstall.memory_size_mb);
                    assert.equal(doc._settings.CPU_Core,taskAPMInstall.CPU_Core);
                    assert.equal(doc._settings.remote_vhd_path,taskAPMInstall.remote_vhd_path);
                    assert.equal(doc.name,taskAPMInstall.name);
                    done();
                });

                
        });
    })


});

describe('task /get',()=>{
    beforeEach((done) => {
        taskModel.remove({}, (err) => { 
            taskImageDeployment.remove({},(err)=>{
                done()
            })
            
        });
    });
    it('shall return 0 avialable tasks in the database when there is nothing',(done)=>{
        chai
        .request(app)
        .get('/api/task')        
        .end((err, res) => {
            assert.equal(res.body.length,0);
            done();
        });
    })
    it('shall return all avialable tasks',(done)=>{
        chai
        .request(app)
        .post('/api/task')
        .send(taskAPM_NewMediaDetection)
        .end((err, res) => {
            res.should.have.status(200);                    
            chai
            .request(app)
            .post('/api/task')
            .send(taskAPMInstall)
            .end((err,res)=>{
                chai
                .request(app)
                .get('/api/task')        
                .end((err, res) => {
                    assert.equal(res.body.length,2);
                    done();
                });
            });
        });
    
    });        

    it('shall return specified tasks',(done)=>{
        chai
        .request(app)
        .post('/api/task')
        .send(taskAPM_NewMediaDetection)
        .end((err, res) => {
            res.should.have.status(200);                    
            chai
            .request(app)
            .post('/api/task')
            .send(taskAPMInstall)
            .end((err,res)=>{
                chai
                .request(app)
                .get('/api/task/APM_NewMediaDetection')        
                .end((err, res) => {
                    assert.equal(res.body.length,1);
                    assert.equal(res.body[0].name,"APM_NewMediaDetection");
                    assert.equal(res.body[0].note,"Install APM");
                    done();
                });
            });
        });        
    });

});

exports.APMInstall=taskAPMInstall;
exports.APMDetection=taskAPM_NewMediaDetection;