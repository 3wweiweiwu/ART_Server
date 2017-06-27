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

exports.postScheduleFromBlueprint=function(vision,blueprint,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .post(`/api/schedule/vision/${vision}/blueprint/${blueprint}`)
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

exports.postNextProject=function(visionName,projectId,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .post(`/api/schedule/vision/${visionName}/next/${projectId}`)
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