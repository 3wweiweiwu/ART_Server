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
exports.putProjectStatus=(projectId,statusId,cb=()=>{})=>{
    return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .put(`/api/project/${projectId}/status/${statusId}`)        
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

exports.putPIDToProject=(projectId,PID,cb=()=>{})=>{
    return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .put(`/api/project/${projectId}/PID/${PID}`)        
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
exports.putVIDToProject=(projectId,VID,cb=()=>{})=>{
    return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .put(`/api/project/${projectId}/VID/${VID}`)        
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
exports.blueprintAPMMediaDetection={
    name:'APM_Media_Detection',
    note:"detect apm media",
    memory_usage_mb:1024,
    disk_usage_mb:1024,
    tasks:[taskSupport.taskMediaDetection.name],
    next:[]    
}
exports.setupAPMMediaDetection={
    name:'APM_Media_Detection',
    note:"detect apm media",
    memory_usage_mb:1024,
    disk_usage_mb:1024,
    tasks:[taskSupport.taskMediaDetection.name],
    next:[]      
}
exports.blueprintAPMMediaDeployment={
    name:'APM_Media_Deployment',
    note:"Install APM media whenever it is posted",
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.taskMediaInstallation.name],
    next:[]    
}
exports.APMMediaDeployment={
    name:'APM_Media_Deployment',
    note:"Install APM media whenever it is posted",
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.taskVMDeployment.name,taskSupport.taskMediaInstallation.name],
    next:[]    
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
exports.projectAESPrestaging={
    name:'AES_Prestaging',
    note:"Install AES media whenever it is posted",
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

exports.postProjectBlueprintAPMPrestaging=()=>{
    return exports.PostNewBlueprint(exports.projectAPMPrestaging);

}

exports.postProjectBlueprintAESPrestaging1=()=>{
    return exports.PostNewBlueprint(exports.projectAPMPrestaging1);
}
exports.postProjectBlueprintAESPrestaging=()=>{
    return exports.PostNewBlueprint(exports.projectAESPrestaging);
}