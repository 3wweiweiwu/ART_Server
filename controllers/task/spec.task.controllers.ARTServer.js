process.env.NODE_ENV = 'test';
let async = require('async');
const EventEmitter = require('events');
let app = require('../../app.js');
var assert = require('assert');
var taskModel = require('../../model/task/task.model.ARTServer.js');
var taskImageDeployment=require('../../model/task/imageDeploy.model.ARTServer');

let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
chai.use(chaiHttp);
const taskAPMInstall={
    name:"APM_Install",
    note:'Install APM',
    task_script_path:'\\\\nhqa-w81-q10\\v7\\Manager\\manager.main.ps1',
    setting_type:"Task.ImageDeploy",
    memory_size_mb:5*1024,
    CPU_Core:4,
    remote_vhd_path:"\\\\wuwei1\\d$\\VM_Image\\en_w2k16_dc_r2_x64_127gb.vhd",
};
const taskAPM_NewMediaDetection={
    name:"APM_NewMediaDetection",
    note:'Install APM',
    task_script_path:'\\\\nhqa-w81-q10\\v7\\Manager\\manager.main.ps1',
    setting_type:"NULL"
};
const taskMissingNote={
    name:"APM_Install",        
    task_script_path:'\\\\nhqa-w81-q10\\v7\\Manager\\manager.main.ps1',
    setting_type:"Task.ImageDeploy",
    memory_size_mb:5*1024,
    CPU_Core:4,
    remote_vhd_path:"\\\\wuwei1\\d$\\VM_Image\\en_w2k16_dc_r2_x64_127gb.vhd",
};  
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