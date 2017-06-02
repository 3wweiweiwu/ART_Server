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

exports.taskAPMInstall={
    name:"APM_Install",
    note:'Install APM',
    task_script_path:'\\\\nhqa-w81-q10\\v7\\Manager\\manager.main.ps1',
    setting_type:"Task.ImageDeploy",
    memory_size_mb:5*1024,
    CPU_Core:4,
    remote_vhd_path:"\\\\wuwei1\\d$\\VM_Image\\en_w2k16_dc_r2_x64_127gb.vhd",
};

exports.taskAPM_NewMediaDetection={
    name:"APM_NewMediaDetection",
    note:'Install APM',
    task_script_path:'\\\\nhqa-w81-q10\\v7\\Manager\\manager.main.ps1',
    setting_type:"NULL"
};

exports.taskMissingNote={
    name:"APM_Install",        
    task_script_path:'\\\\nhqa-w81-q10\\v7\\Manager\\manager.main.ps1',
    setting_type:"Task.ImageDeploy",
    memory_size_mb:5*1024,
    CPU_Core:4,
    remote_vhd_path:"\\\\wuwei1\\d$\\VM_Image\\en_w2k16_dc_r2_x64_127gb.vhd",
};  
exports.PostTask=(Json,cb=()=>{})=>{
    var prom= new Promise((resolve,reject)=>{
        chai
        .request(app)
        .post('/api/task')
        .send(Json)
        .end((err, res) => {
            if(err){ 
                reject(err);
                return cb(err);
            }
            else {
                resolve(res);
                return cb(null,res);
            }
            
        });  
    });
    return prom;
}