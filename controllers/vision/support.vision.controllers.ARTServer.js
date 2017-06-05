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

exports.PutRegistryMachine1=()=>{
    return exports.PutRegistry(exports.registryMachineName1.name,exports.registryMachineName1.key,exports.registryMachineName1.value);
}
exports.PutRegistryMachine2=()=>{
    return exports.PutRegistry(exports.registryMachineName2.name,exports.registryMachineName2.key,exports.registryMachineName2.value);
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