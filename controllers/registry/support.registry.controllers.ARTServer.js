process.env.NODE_ENV = 'test';
let async = require('async');
const EventEmitter = require('events');
let app = require('../../app.js');
var assert = require('assert');
var visionModel = require('../../model/vision/vision.model.ARTServer.js');
var visionControl=require('../vision/vision.controllers.ARTServer')
let projectSupport=require('../../controllers/project/support.project.ARTServer')
let taskSupport=require('../../controllers/task/support.Task.Controllers.ARTServer')
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
chai.use(chaiHttp);

exports.postRegistry=function(vision,project,task,key,value,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .post(`/api/registry/vision/${vision}/project/${project}/task/${task}/key/${key}`)
        .send({value:value})
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

exports.getRegistry=function(vision,project,task,key,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .get(`/api/registry/vision/${vision}/project/${project}/task/${task}/key/${key}`)        
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