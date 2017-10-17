process.env.NODE_ENV = 'test';


let app = require('../../app.js');





let chai = require('chai');
let chaiHttp = require('chai-http');

chai.use(chaiHttp);
exports.Keys={
    Template:'Template'
};
exports.postRegistry=function(vision,project,task,key,value,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        key=key.replace('/','%2F');
        chai
            .request(app)
            .post(`/api/registry/vision/${vision}/project/${project}/task/${task}/key/${key}`)
            .send({value:value})
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(err);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });
};

exports.getRegistry=function(vision,project,task,key,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .get(`/api/registry/vision/${vision}/project/${project}/task/${task}/key/${key}`)        
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(err);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });
};

exports.getCompleteRegistry=function(vision,project,task,key,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .get(`/api/registry/vision/${vision}/project/${project}/task/${task}/key/${key}/all`)        
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(err);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });
};
exports.setRegistryExpired=function(vision,project,task,key,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .put(`/api/registry/vision/${vision}/project/${project}/task/${task}/key/${key}/expired`)        
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(err);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });
};
exports.isRegistryExpired=function(vision,project,task,key,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .get(`/api/registry/vision/${vision}/project/${project}/task/${task}/key/${key}/expired`)        
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(err);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });
};