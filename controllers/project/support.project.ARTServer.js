var taskModel = require('../../model/task/task.model.ARTServer.js');
var taskImageDeployment=require('../../model/task/imageDeploy.model.ARTServer');
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let support=require('./support.project.ARTServer')
var projectBlueprintModel=require('../../model/project/projectBlueprint.model.ARTServer');
let app = require('../../app.js');
let taskSupport=require('../task/support.Task.Controllers.ARTServer')
exports.PostNewBlueprint=(query,cb=()=>{})=>{
    return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .post('/api/projectBlueprint')
        .send(query)
        .end((err, res) => {
            
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

exports.projectAPMPrestaging={
    name:'APM_Prestaging',
    note:"Install APM media whenever it is posted",
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.taskAPM_NewMediaDetection.name,taskSupport.taskAPMInstall.name],
    next:[]
    
}
exports.projectAPMPrestaging1={
    name:'APM_Prestaging1',
    note:"Install APM media whenever it is posted",
    memory_usage_mb:10*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.taskAPM_NewMediaDetection.name,taskSupport.taskAPMInstall.name],
    next:[]
}

exports.projectAPMPrestaging_Override={
    name:'APM_Prestaging',
    note:"When latest media is posted, install media",
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.taskAPM_NewMediaDetection.name,taskSupport.taskAPMInstall.name],
    next:[]
}

exports.projectAPMPrestaging_Invalid={
    name:'APM_Prestaging',
    note:"When latest media is posted, install media",
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:['taskSupport.APMDetection.name,taskSupport.APMInstall.name'],
    next:[]
}