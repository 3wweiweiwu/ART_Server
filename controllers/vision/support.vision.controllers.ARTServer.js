process.env.NODE_ENV = 'test';
let async = require('async');
const EventEmitter = require('events');
let app = require('../../app.js');
var assert = require('assert');
var visionModel = require('../../model/vision/vision.model.ARTServer.js');
var visionControl=require('./vision.controllers.ARTServer')
let projectSupport=require('../../controllers/project/support.project.ARTServer')
let taskSupport=require('../../controllers/task/support.Task.Controllers.ARTServer')
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
chai.use(chaiHttp);

exports.postNewVision=function(visionObj,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .post('/api/vision')
        .send(visionObj)
        .end((err,res)=>{
            if(err){
                reject({
                    errorInfo:err,
                    resInfo:res
                });
                return cb(err);
            }
            else{
                resolve(res);
                return cb(null,res);
            }
        });
    });
}
exports.postNewProject=function(vision,blueprint,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .post(`/api/vision/${vision}/NewProject/${blueprint}`)
        .end((err,res)=>{
            if(err){
                let result={err:err,res:res}
                reject(result);
                return cb(err);
            }
            else{
                resolve(res);
                return cb(null,res);
            }
        });
    });
}

exports.PutKeyProject=function(vision,blueprint,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .put(`/api/vision/${vision}/key_projects/${blueprint}`)
            .end((err, res) => {
                if(err){
                    let result={err:err,res:res}
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }            
            });        
    })
}
exports.deleteKeyProject=function(vision,blueprint,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .del(`/api/vision/${vision}/key_projects/${blueprint}`)
            .end((err, res) => {
                if(err){
                    let result={err:err,res:res}
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }            
            });        
    })
}
exports.PutRegistry=(visionName,key,value,cb=()=>{})=>{
    return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .put('/api/vision/'+exports.visionAPMChef.name+'/registry')
        .send({
            key:key,
            value:value
        })
        .end((err,res)=>{
            if(err){
                reject(err);
                return cb(err);
            }
            else{
                resolve(res);
                return cb(null,res);
            }
        });
    });
}

exports.GetRegistry=(visionName,key,cb=()=>{})=>{
    return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .get(`/api/vision/${exports.visionAPMChef.name}/registry/${key}`)
        .end((err,res)=>{
            if(err){
                let result={err:err,res:res}
                reject(result);
                return cb(result);
            }
            else{
                resolve(res);
                return cb(null,res);
            }
        });
    });
}
exports.GetRegistryForMachineName=()=>{
    return exports.GetRegistry(exports.registryMachineName1.projectName,exports.registryMachineName1.key);
}

exports.PutRegistryMachine1=()=>{
    return exports.PutRegistry(exports.registryMachineName1.name,exports.registryMachineName1.key,exports.registryMachineName1.value);
}
exports.PutRegistryMachine2=()=>{
    return exports.PutRegistry(exports.registryMachineName2.name,exports.registryMachineName2.key,exports.registryMachineName2.value);
}

exports.PutBlueprintSchedule=function(visionName,blueprintName,cb=()=>{}){
     return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .put(`/api/vision/${visionName}/project_schedule/blueprint/${blueprintName}`)
        .end((err,res)=>{
            if(err){
                let result={err:err,res:res}
                reject(result);
                return cb(result);
            }
            else{
                resolve(res);
                return cb(null,res);
            }
        });
    });   
}

exports.putBlueprintServerAsk=function(visionName,blueprintName,serverAsk,cb=()=>{}){
     return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .put(`/api/vision/${visionName}/project_schedule/blueprint/${blueprintName}/server_ask/${serverAsk}`)
        .end((err,res)=>{
            if(err){
                let result={err:err,res:res}
                reject(result);
                return cb(result);
            }
            else{
                resolve(res);
                return cb(null,res);
            }
        });
    });   
}
exports.putBlueprintMachineInstance=function(visionName,blueprintName,machine,ask,cb=()=>{}){
     return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .put(`/api/vision/${visionName}/project_schedule/blueprint/${blueprintName}/machine/${machine}/ask/${ask}`)
        .end((err,res)=>{
            if(err){
                let result={err:err,res:res}
                reject(result);
                return cb(result);
            }
            else{
                resolve(res);
                return cb(null,res);
            }
        });
    });   
}

exports.putNextBlueprint=function(visionName,baseBlueprint,nextBlueprint,cb=()=>{}){
     return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .put(`/api/vision/${visionName}/project_schedule/blueprint/${baseBlueprint}/next/${nextBlueprint}`)
        .end((err,res)=>{
            if(err){
                let result={err:err,res:res}
                reject(result);
                return cb(result);
            }
            else{
                resolve(res);
                return cb(null,res);
            }
        });
    });   
}
exports.putNextTask=function(visionName,project_id,cb=()=>{}){
     return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .put(`/api/vision/${visionName}/current_projects/${project_id}/next_task`)
        .end((err,res)=>{
            if(err){
                let result={err:err,res:res}
                reject(result);
                return cb(result);
            }
            else{
                resolve(res);
                return cb(null,res);
            }
        });
    });   
}
exports.putProjectHost=function(visionName,project_id,host_name,cb=()=>{}){
     return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .put(`/api/vision/${visionName}/current_projects/${project_id}/host/${host_name}`)
        .end((err,res)=>{
            if(err){
                let result={err:err,res:res}
                reject(result);
                return cb(result);
            }
            else{
                resolve(res);
                return cb(null,res);
            }
        });
    });   
}

exports.putProjectStatus=function(visionName,project_id,status,cb=()=>{}){
     return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .put(`/api/vision/${visionName}/current_projects/${project_id}/status/${status}`)
        .end((err,res)=>{
            if(err){
                let result={err:err,res:res}
                reject(result);
                return cb(result);
            }
            else{
                resolve(res);
                return cb(null,res);
            }
        });
    });   
}


exports.deleteCurrentProject=function(visionName,project_id,cb=()=>{}){
     return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .del(`/api/vision/${visionName}/current_projects/${project_id}`)
        .end((err,res)=>{
            if(err){
                let result={err:err,res:res}
                reject(result);
                return cb(result);
            }
            else{
                resolve(res);
                return cb(null,res);
            }
        });
    });   
}


exports.deleteProjectSchedule=function(visionName,blueprint,cb=()=>{}){
     return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .del(`/api/vision/${visionName}/project_schedule/${blueprint}`)
        .end((err,res)=>{
            if(err){
                let result={err:err,res:res}
                reject(result);
                return cb(result);
            }
            else{
                resolve(res);
                return cb(null,res);
            }
        });
    });   
}

exports.visionAPMChef={
    name:'APM_Chef',
    note:'Prepare daily APM image',
    status:'online'
}
exports.visionAESChef={
    name:'AES_Chef',
    note:'Prepare daily AES image',
    status:'online'
}
exports.visionAPMChefOffline={
    name:'APM_Chef',
    note:'Prepare daily APM image',
    status:'offline'
}
exports.visionAPMChefIncomplete={
    name:'APM_Chef',    
    status:'offline'
}

exports.registryMachineName1={
    projectName:exports.visionAPMChef.name,
    key:'machine name',
    value:'machine 1'
}

exports.registryMachineName2={
    projectName:exports.visionAPMChef.name,
    key:'machine name',
    value:'machine 2'
}

exports.PostVisionAPMChef=()=>{
    return exports.postNewVision(exports.visionAPMChef);
}

exports.PostVisionAESChef=()=>{
    return exports.postNewVision(exports.visionAESChef);
}

exports.PostVisionAPMChefoffline=()=>{
    return exports.postNewVision(exports.visionAPMChefOffline)
}