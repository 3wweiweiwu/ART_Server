process.env.NODE_ENV = 'test';
//let async = require('async');
//const EventEmitter = require('events');
let app = require('../../app.js');
//var assert = require('assert');
var visionModel = require('../../model/vision/vision.model.ARTServer.js');
//var visionControl=require('./vision.controllers.ARTServer');
//let projectSupport=require('../../controllers/project/support.project.ARTServer');
//let taskSupport=require('../../controllers/task/support.Task.Controllers.ARTServer');
let chai = require('chai');
let chaiHttp = require('chai-http');
//let should = chai.should();
chai.use(chaiHttp);
exports.postVisionWithCheck=function(visionObj){
    return new Promise((resolve,reject)=>{
        visionModel.findOne({name:visionObj.name})
            .then(vision=>{
                if(vision==null){
                    exports.postNewVision(visionObj)
                        .then((info)=>{
                            resolve(info);
                        })
                        .catch(err=>{
                            reject(err);
                        });
                }
                else{
                    //while there is existing vision with the same name, then stop
                    resolve();
                }
            });
    });
};
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
};
exports.postNewProject=function(vision,blueprint,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .post(`/api/vision/${vision}/NewProject/${blueprint}`)
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

exports.PutKeyProject=function(vision,blueprint,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .put(`/api/vision/${vision}/key_projects/${blueprint}`)
            .end((err, res) => {
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }            
            });        
    });
};
exports.deleteKeyProject=function(vision,blueprint,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .del(`/api/vision/${vision}/key_projects/${blueprint}`)
            .end((err, res) => {
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }            
            });        
    });
};
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
};

exports.GetRegistry=(visionName,key,cb=()=>{})=>{
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .get(`/api/vision/${exports.visionAPMChef.name}/registry/${key}`)
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });
};
exports.GetRegistryForMachineName=()=>{
    return exports.GetRegistry(exports.registryMachineName1.projectName,exports.registryMachineName1.key);
};

exports.PutRegistryMachine1=()=>{
    return exports.PutRegistry(exports.registryMachineName1.name,exports.registryMachineName1.key,exports.registryMachineName1.value);
};
exports.PutRegistryMachine2=()=>{
    return exports.PutRegistry(exports.registryMachineName2.name,exports.registryMachineName2.key,exports.registryMachineName2.value);
};

exports.PutBlueprintSchedule=function(visionName,blueprintName,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .put(`/api/vision/${visionName}/project_schedule/blueprint/${blueprintName}`)
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });   
};

exports.putBlueprintServerAsk=function(visionName,blueprintName,serverAsk,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .put(`/api/vision/${visionName}/project_schedule/blueprint/${blueprintName}/server_ask/${serverAsk}`)
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });   
};
exports.putBlueprintMachineInstance=function(visionName,blueprintName,machine,ask,vidList=[],cb=()=>{}){
    return new Promise((resolve,reject)=>{
        
        chai
            .request(app)
            .put(`/api/vision/${visionName}/project_schedule/blueprint/${blueprintName}/machine/${machine}/ask/${ask}`)
            .send({
                vid_list:vidList
            })
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });   
};

exports.putNextBlueprint=function(visionName,baseBlueprint,nextBlueprint,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .put(`/api/vision/${visionName}/project_schedule/blueprint/${baseBlueprint}/next/${nextBlueprint}`)
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });   
};
exports.putNextTask=function(visionName,project_id,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .put(`/api/vision/${visionName}/current_projects/${project_id}/next_task`)
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });   
};
exports.putProjectHost=function(visionName,project_id,host_name,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .put(`/api/vision/${visionName}/current_projects/${project_id}/host/${host_name}`)
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });   
};

exports.putProjectStatus=function(visionName,project_id,status,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .put(`/api/vision/${visionName}/current_projects/${project_id}/status/${status}`)
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });   
};


exports.deleteCurrentProject=function(visionName,project_id,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .del(`/api/vision/${visionName}/current_projects/${project_id}`)
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });   
};


exports.deleteProjectSchedule=function(visionName,blueprint,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .del(`/api/vision/${visionName}/project_schedule/${blueprint}`)
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });   
};
exports.deleteDormInProjectSchedule=function(visionName,blueprint,dorm,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .del(`/api/vision/${visionName}/project_schedule/${blueprint}/machine_demand/${dorm}`)
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });   
};

exports.deleteNextBlueprintInProjectSchedule=function(visionName,blueprint,nextBlueprint,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .del(`/api/vision/${visionName}/project_schedule/${blueprint}/next/${nextBlueprint}`)
            .end((err,res)=>{
                if(err){
                    let result={err:err,res:res};
                    reject(result);
                    return cb(result);
                }
                else{
                    resolve(res);
                    return cb(null,res);
                }
            });
    });   
};
exports.visionAPMChef={
    name:'APM_Chef',
    note:'Prepare daily APM image',
    status:'online'
};
exports.visionAESChef={
    name:'AES_Chef',
    note:'Prepare daily AES image',
    status:'online'
};
exports.visionAPMChefOffline={
    name:'APM_Chef',
    note:'Prepare daily APM image',
    status:'offline'
};
exports.visionAPMChefIncomplete={
    name:'APM_Chef',    
    status:'offline'
};

exports.registryMachineName1={
    projectName:exports.visionAPMChef.name,
    key:'machine name',
    value:'machine 1'
};

exports.registryMachineName2={
    projectName:exports.visionAPMChef.name,
    key:'machine name',
    value:'machine 2'
};

exports.PostVisionAPMChef=()=>{
    return exports.postNewVision(exports.visionAPMChef);
};

exports.PostVisionAESChef=()=>{
    return exports.postNewVision(exports.visionAESChef);
};

exports.PostVisionAPMChefoffline=()=>{
    return exports.postNewVision(exports.visionAPMChefOffline);
};
exports.sampleMtell={
    name:'MTELL_Prestaging',
    note:'Prepare daily Mtell image',
    status:'online'
};

exports.sampleMtellDeployment={
    name:'MTELL_Deployment',
    note:'Install daily Mtell image to multiple clients',
    status:'online'
};
exports.sampleSCMMVT={
    name:'SCM MVT',
    note:'Perform MVT on SCM',
    status:'online'  
};

exports.sampleMtellMVT={
    name:'MTELL_MVT',
    note:'Perform MVT on mtell',
    status:'online'    
};
exports.sample_QuickTest={
    name:'sample_QuickTest',
    note:'Perform sample_QuickTest',
    status:'online'  
};


exports.sample_Prestaging={
    Analytics:{
        name:'Analytics Prestaging',
        note:'setup basic image for Analytics',
        status:'online'  
    },
    ProMV:{
        name:'ProMV Prestaging',
        note:'setup basic image for ProMV',
        status:'online' 
    }
};
exports.sampleAPMPrestaging={
    name:'APM Prestaging',
    note:'setup basic image for APM',
    status:'online'    
};
exports.sample_AES_Prestaging={
    name:'AES Prestaging',
    note:'setup basic image for AES',
    status:'online'    
};

exports.sampleAPMDeployment={
    name:'APM Deployment',
    note:'Deploy APM media whenever it is posted',
    status:'online'    
};

exports.sample_APM_Deployment={
    AFR_QE_Team_HQDEVBLADE28:{
        name:'APM Deployment for AFR QE in HQDEVBLADE28',
        note:'Deploy APM media for AFR QE whenever it is posted',
        status:'online'         
    },
    Analytics_QE_Team_HOUQAEBLADE114:{
        name:'APM Deployment for Analytics QE in Houston (HOUQAEBLADE114)',
        note:'Deploy APM media for Analytics QE whenever it is posted',
        status:'online'         
    },
    Analytics_RD_Team_HOUQAEBLADE114:{
        name:'APM Deployment for ProMV RD in Houston (HOUQAEBLADE114)',
        note:'Deploy APM media for ProMV RD whenever it is posted',
        status:'online'   
    },
    Analytics_QE_Team_HQDEVRACK2:{
        name:'APM Deployment for Analytics QE team in Bedford (HQDEVRACK2)',
        note:'Deploy APM media for HOUQAEBLADE114 whenever it is posted',
        status:'online'  
    },
    Analytics_QE_Team_SHQEANALYTICS3:{
        name:'APM Deployment for QE team in Shanghai (SHQEANALYTICS3)',
        note:'Deploy APM media for SHQEANALYTICS3 whenever it is posted',
        status:'online' 
    },
    ProMV:{
        QE:{
            Mvt2_apm_d5:{
                name:'ProMV Deployment for Bedford QE team in Mvt2-apm-d5',
                note:'Deploy ProMV media for ProMV RD whenever it is posted',
                status:'online'  
            },
            Mvt2_pro_d1:{
                name:'ProMV Deployment for Bedford RD team and QE in Mvt2-pro-d1',
                note:'Deploy ProMV media for ProMV RD whenever it is posted',
                status:'online'  
            },
            Mvt2_pro_d2:{
                name:'ProMV Deployment for Bedford RD team and QE in Mvt2-pro-d2',
                note:'Deploy ProMV media for ProMV RD whenever it is posted',
                status:'online'  
            },
            Mvt2_pro_d3:{
                name:'ProMV Deployment for Shanghai QE team in Mvt2-pro-d3',
                note:'Deploy ProMV media for ProMV RD whenever it is posted',
                status:'online'  
            }        
        }
    }
};




exports.sample_WUWEI1_APMDeployment={
    name:'APM Deployment for WUWEI1',
    note:'Deploy APM media for WUWEI1 whenever it is posted',
    status:'online'    
};

exports.sampleMSCPrestaging={
    name:'MSC Prestaging',
    note:'setup basic image for MSC',
    status:'online'    
};

exports.sample_MSC_Deployment={
    name:'MSC Suite VHD Deployment',
    note:'deploy prepared VHD for MSC',
    status:'online'    
};

exports.sample_MTELL_Deployment_anand={
    name:'MTELL Suite VHD Deployment for R&D - Anand',
    note:'deploy prepared VHD for MSC',
    status:'online'    
};