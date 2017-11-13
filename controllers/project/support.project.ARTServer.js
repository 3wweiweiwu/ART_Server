

let chai = require('chai');
let app = require('../../app.js');
let taskSupport=require('../task/support.Task.Controllers.ARTServer');
//let blueprintModel=require('../../model/project/projectBlueprint.model.ARTServer');
exports.PostNewBlueprint=(query,cb=()=>{})=>{
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .post('/api/projectBlueprint')
            .send(query)
            .end((err, res) => {            
                if(err) {
                    reject(err);
                    return cb(err);
                }
                else {
                    resolve(res);
                    return cb(null,res);
                }
            });   
    });
};

exports.PostNewBlueprintWithCheck=function(blueprintObj){
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .post('/api/projectBlueprintWithCheck')
            .send(blueprintObj)
            .end((err, res) => {            
                if(err) {
                    reject(err);                    
                }
                else {
                    resolve(res);                    
                }
            });   
    });
};
exports.putProjectStatus=(projectId,statusId,cb=()=>{})=>{
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .put(`/api/project/${projectId}/status/${statusId}`)        
            .end((err, res) => {
                
                if(err) {
                    reject(err);
                    return cb(err);
                }
                else {
                    resolve(res);
                    return cb(null,res);
                }
            });   
    });
};

exports.putPIDToProject=(projectId,PID,cb=()=>{})=>{
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .put(`/api/project/${projectId}/PID/${PID}`)        
            .end((err, res) => {
            
                if(err) {
                    reject(err);
                    return cb(err);
                }
                else {
                    resolve(res);
                    return cb(null,res);
                }
            });   
    });
};
exports.putVIDToProject=(projectId,VID,cb=()=>{})=>{
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .put(`/api/project/${projectId}/VID/${VID}`)        
            .end((err, res) => {
            
                if(err) {
                    reject(err);
                    return cb(err);
                }
                else {
                    resolve(res);
                    return cb(null,res);
                }
            });   
    });
};
exports.sampleBP_MtellMediaDetection={
    name:'Mtell_Media_Detection',
    note:'detect apm media',
    memory_usage_mb:1024,
    disk_usage_mb:1024,
    tasks:[taskSupport.taskMediaDetection.name],
    next:[]    
};

exports.sampleBP_APMMediaDetection={
    name:'APM_Media_Detection',
    note:'detect apm media',
    memory_usage_mb:1024,
    disk_usage_mb:1024,
    tasks:[taskSupport.taskMediaDetection.name],
    next:[]    
};
exports.blueprintAPMMediaDetection={
    name:'APM_Media_Detection',
    note:'detect apm media',
    memory_usage_mb:1024,
    disk_usage_mb:1024,
    tasks:[taskSupport.taskMediaDetection.name],
    next:[]    
};
exports.setupAPMMediaDetection={
    name:'APM_Media_Detection',
    note:'detect apm media',
    memory_usage_mb:1024,
    disk_usage_mb:1024,
    tasks:[taskSupport.taskMediaDetection.name],
    next:[]      
};
exports.blueprintAPMMediaDeployment={
    name:'APM_Media_Deployment',
    note:'Install APM media whenever it is posted',
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.taskMediaInstallation.name],
    next:[]    
};
exports.blueprintAPMMediaDeployment1={
    name:'APM_Media_Deployment',
    note:'Install APM media whenever it is posted',
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.taskMediaInstallation.name,taskSupport.taskMediaDetection.name],
    next:[]    
};
exports.sampleMtellDeployment={
    name:'Mtell_Media_Deployment',
    note:'Install APM media whenever it is posted',
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sampleUninstallProduct.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleInstallMedia.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleVHDCheckin.name],
    next:[]       
};
exports.sampleMTELLVHDDetection={
    name:'Mtell VHD Detection',
    note:'Detect Mtell VHD whenever it is posted',
    memory_usage_mb:1,
    disk_usage_mb:1,
    tasks:[taskSupport.sampleVHDDetection.name],
    next:[]       
};

exports.sampleMtellVHDDeployment={
    name:'Mtell VHD Deployment',
    note:'Deploy Mtell VHD whenever it is posted',
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.sampleDeployStandardVHDImage.name],
    next:[]       
};
exports.sampleMtellMVT={
    name:'Mtell MVT',
    note:'Validate Mtell MVT whenever it is posted',
    memory_usage_mb:4*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sample_MVT.mtell.FileVersionCheck.name,taskSupport.samplePlanGeneration.name,taskSupport.sampleResume.name],
    next:[]           
};

exports.sample_Mtell={
    Deployment:{
        Mtell_RD_Anand:{
            name:'Mtell Media Deployment for R&D Team - Anand',
            note:'Deploy Mtell VHD whenever it is posted',
            memory_usage_mb:6*1024,
            disk_usage_mb:10*1024,
            tasks:[taskSupport.sampleDeployStandardVHDImage.name],
            next:[]  
        }
    }
};
//start of aes
//#region aes
exports.sample_AES_Prestaging={
    name:'AES Prestaing',
    note:'Install APM media whenever it is posted',
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sampleUninstallProduct.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleInstallMedia.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleInstallPatch.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleVHDCheckin.name],
    next:[]       
};
exports.sample_AES_MediaDetection={
    name:'AES media detection',
    note:'detect apm media',
    memory_usage_mb:1024,
    disk_usage_mb:1024,
    tasks:[taskSupport.taskMediaDetection.name],
    next:[]    
};
//#endregion
//////start of apm
//#region apm
exports.sample_APMMediaDetection={
    name:'APM media detection',
    note:'detect apm media',
    memory_usage_mb:1024,
    disk_usage_mb:1024,
    tasks:[taskSupport.taskMediaDetection.name],
    next:[]    
};
exports.sampleAPMPrestaging={
    name:'APM Prestaing',
    note:'Install APM media whenever it is posted',
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sampleUninstallProduct.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleInstallMedia.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleInstallPatch.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleVHDCheckin.name],
    next:[]       
};
exports.sampleAPMVHDDeployment={
    name:'APM VHD Deployment',
    note:'Deploy APM VHD whenever it is posted',
    memory_usage_mb:2*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sampleConfigureIP21.name],
    next:[]       
};
exports.sample_APM_Deployment={
    ProMV:{
        QE:{
            Mvt2_apm_d5:{
                name:'ProMV Deployment for Houston QE in HQDEVRACK2',
                note:'Deploy APM VHD whenever it is posted',
                memory_usage_mb:2*1024,
                disk_usage_mb:10*1024,
                tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sampleConfigureIP21.name],
                next:[] 
            },
            Mvt2_pro_d1:{
                
                name:'ProMV Deployment for Bedford R&D in HQDEVRACK2',
                note:'Deploy APM VHD whenever it is posted',
                memory_usage_mb:2*1024,
                disk_usage_mb:10*1024,
                tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sampleConfigureIP21.name],
                next:[] 
                
            },
            Mvt2_pro_d2:{
                
                name:'ProMV Deployment for Bedford R&D in HQDEVRACK2',
                note:'Deploy APM VHD whenever it is posted',
                memory_usage_mb:2*1024,
                disk_usage_mb:10*1024,
                tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sampleConfigureIP21.name],
                next:[] 
                
            },
            Mvt2_pro_d3:{
                
                name:'ProMV Deployment for Shanghai QE in SHQEANALYTICS3',
                note:'Deploy APM VHD whenever it is posted',
                memory_usage_mb:2*1024,
                disk_usage_mb:10*1024,
                tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sampleConfigureIP21.name],
                next:[] 
                
            },
        }
    },
    AFR_QE_HQDEVBLADE28:{
        name:'APM VHD Deployment',
        note:'Deploy APM VHD whenever it is posted',
        memory_usage_mb:2*1024,
        disk_usage_mb:10*1024,
        tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sampleConfigureIP21.name],
        next:[] 
    },
    Analytics_QE_HOUQAEBLADE114:{
        name:'Analytics Media Deployment for Analytics QE team in blade HOUQAEBLADE114',
        note:'Deploy APM VHD whenever it is posted',
        memory_usage_mb:2*1024,
        disk_usage_mb:10*1024,
        tasks:[
            taskSupport.sampleDeployStandardVHDImage.name,
            taskSupport.sampleConfigureIP21.name,
            taskSupport.sample_PostDeployment.Analytics.postConfigurationForDicson.name
        ],
        next:[]  
    },
    Analytics_RD_HOUQAEBLADE114:{
        name:'Analytics Deployment for Bedford Analytics Team in blade HOUQAEBLADE114',
        note:'Deploy APM VHD whenever it is posted',
        memory_usage_mb:2*1024,
        disk_usage_mb:10*1024,
        tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sampleConfigureIP21.name],
        next:[]  
    },
    Analytics_QE_HQDEVRACK2:{
        name:'Analytics Deployment for Bedford Analytics team in blade HQDEVRACK2',
        note:'Deploy APM VHD whenever it is posted',
        memory_usage_mb:2*1024,
        disk_usage_mb:10*1024,
        tasks:[
            taskSupport.sampleDeployStandardVHDImage.name,
            taskSupport.sampleConfigureIP21.name,
            taskSupport.sample_PostDeployment.Analytics.postConfigurationForDicson.name
        ],
        next:[]  
    },
    Analytics_QE_SHQEANALYTICS3:{
        name:'Analytics Deployment for Shanghai Analytics team in blade SHQEANALYTICS3',
        note:'Deploy APM VHD whenever it is posted',
        memory_usage_mb:2*1024,
        disk_usage_mb:10*1024,
        tasks:[
            taskSupport.sampleDeployStandardVHDImage.name,
            taskSupport.sampleConfigureIP21.name,
            taskSupport.sample_PostDeployment.Analytics.postConfigurationForDicson.name
        ],
        next:[]  
    }    
};

exports.sample_HOUQAEBLADE114_APMVHDDeployment={
    name:'APM VHD Deployment for blade HOUQAEBLADE114',
    note:'Deploy APM VHD whenever it is posted',
    memory_usage_mb:2*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.sampleDeployStandardVHDImage.name],
    next:[]       
};

exports.sampleAPMVHDDetection={
    name:'APM VHD Detection',
    note:'Detect APM VHD whenever it is posted',
    memory_usage_mb:1,
    disk_usage_mb:1,
    tasks:[taskSupport.sampleVHDDetection.name],
    next:[]       
};
//end of apm section
//#endregion

//#region analytics cp
exports.sample_AnalyticsCP={
    Prestaging:{
        name:'Analytics CP Prestaing',
        note:'Install APM media whenever it is posted',
        memory_usage_mb:6*1024,
        disk_usage_mb:10*1024,
        tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sampleUninstallProduct.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleInstallMedia.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleInstallPatch.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleVHDCheckin.name],
        next:[]  
    },
    VHD_Detection:{
        name:'Analytics CP Detection',
        note:'Detect Analytics CP VHD whenever it is posted',
        memory_usage_mb:1,
        disk_usage_mb:1,
        tasks:[taskSupport.sampleVHDDetection.name],
        next:[]           
    },
    Media_Detection:{
        name:'Analytics CP media detection',
        note:'detect analytics media',
        memory_usage_mb:1024,
        disk_usage_mb:1024,
        tasks:[taskSupport.taskMediaDetection.name],
        next:[]          
    },
    Deployment:{
        Analytics_QE:{},
        Analytics_RD:{}
    }
};
    
//#endregion
//#region promv
exports.sample_ProMVCP={
    Prestaging:{
        name:'ProMV Prestaing',
        note:'Install ProMV media whenever it is posted',
        memory_usage_mb:6*1024,
        disk_usage_mb:10*1024,
        tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sampleUninstallProduct.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleInstallMedia.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleInstallPatch.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleVHDCheckin.name],
        next:[]  
    },
    VHD_Detection:{
        name:'ProMV Detection',
        note:'Detect ProMV VHD whenever it is posted',
        memory_usage_mb:1,
        disk_usage_mb:1,
        tasks:[taskSupport.sampleVHDDetection.name],
        next:[]           
    },
    Media_Detection:{
        name:'ProMV media detection',
        note:'detect ProMV media',
        memory_usage_mb:1024,
        disk_usage_mb:1024,
        tasks:[taskSupport.taskMediaDetection.name],
        next:[]          
    },
    Deployment:{
        Analytics_QE:{},
        Analytics_RD:{}
    }
};
//#endregion

//#region msc
exports.sample_MSC_MediaDetection={
    name:'MSC media detection',
    note:'detect msc media',
    memory_usage_mb:1024,
    disk_usage_mb:1024,
    tasks:[taskSupport.taskMediaDetection.name],
    next:[]    
};
exports.sample_MSC_Prestaging={
    name:'MSC Prestaing',
    note:'Install MSC media whenever it is posted',
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sampleUninstallProduct.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleInstallMedia.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleInstallPatch.name,taskSupport.sampleRestart.name,taskSupport.sampleWait.name,taskSupport.sampleVHDCheckin.name],
    next:[]       
};
exports.sample_MSC_SCM_DeploymentForMVT={
    name:'SCM MVT',
    note:'Validate SCM MVT whenever it is posted',
    memory_usage_mb:4*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.samplePlanGeneration.name,taskSupport.sampleResume.name],
    next:[]           
};
exports.sample_MSC_Deployment={
    name:'MSC Standard Media VHD Image Deployment',
    note:'Deploy MSC Standard Media whenever it is posted',
    memory_usage_mb:2*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.sampleDeployStandardVHDImage.name],
    next:[]       
};
exports.sample_SCM_MVT={
    name:'SCM MVT',
    note:'Validate Mtell MVT whenever it is posted',
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sample_MVT.common.SLMConfiguration.name,taskSupport.samplePlanGeneration.name,taskSupport.sampleResume.name],
    next:[]           
};
exports.sample_A1PE_MVT={
    name:'A1PE MVT',
    note:'Validate A1PE MVT whenever it is posted',
    memory_usage_mb:4*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.sample_MVT.common.SLMConfiguration.name,taskSupport.sample_MVT.a1pe.generic_config.name],
    next:[]           
};
exports.sample_MSC_VHDDetection={
    name:'MSC VHD Detection',
    note:'Detect MSC VHD whenever it is posted',
    memory_usage_mb:1,
    disk_usage_mb:1,
    tasks:[taskSupport.sampleVHDDetection.name],
    next:[]       
};
//#endregion

exports.sampleAPMMVT={
    name:'APM MVT',
    note:'Validate APM MVT whenever it is posted',
    memory_usage_mb:4*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.sampleDeployStandardVHDImage.name,taskSupport.samplePlanGeneration.name,taskSupport.sampleResume.name],
    next:[]           
};
exports.APMMediaDeployment={
    name:'APM_Media_Deployment',
    note:'Install APM media whenever it is posted',
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.taskVMDeployment.name,taskSupport.taskMediaInstallation.name],
    next:[]    
};
exports.projectAPMPrestaging={
    name:'APM_Prestaging',
    note:'Install APM media whenever it is posted',
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.taskAPM_NewMediaDetection.name,taskSupport.taskAPMInstall.name],
    next:[]
    
};
exports.projectAPMPrestaging1={
    name:'APM_Prestaging1',
    note:'Install APM media whenever it is posted',
    memory_usage_mb:10*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.taskAPM_NewMediaDetection.name,taskSupport.taskAPMInstall.name],
    next:[]
};
exports.projectAESPrestaging={
    name:'AES_Prestaging',
    note:'Install AES media whenever it is posted',
    memory_usage_mb:10*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.taskAPM_NewMediaDetection.name,taskSupport.taskAPMInstall.name],
    next:[]
};
exports.projectAPMPrestaging_Override={
    name:'APM_Prestaging',
    note:'When latest media is posted, install media',
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:[taskSupport.taskAPM_NewMediaDetection.name,taskSupport.taskAPMInstall.name],
    next:[]
};

exports.projectAPMPrestaging_Invalid={
    name:'APM_Prestaging',
    note:'When latest media is posted, install media',
    memory_usage_mb:6*1024,
    disk_usage_mb:10*1024,
    tasks:['taskSupport.APMDetection.name,taskSupport.APMInstall.name'],
    next:[]
};

exports.postProjectBlueprintAPMPrestaging=()=>{
    return exports.PostNewBlueprint(exports.projectAPMPrestaging);

};

exports.postProjectBlueprintAESPrestaging1=()=>{
    return exports.PostNewBlueprint(exports.projectAPMPrestaging1);
};
exports.postProjectBlueprintAESPrestaging=()=>{
    return exports.PostNewBlueprint(exports.projectAESPrestaging);
};