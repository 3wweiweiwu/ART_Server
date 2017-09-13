process.env.NODE_ENV = 'test';

let app = require('../../app.js');

let chai = require('chai');
let chaiHttp = require('chai-http');

chai.use(chaiHttp);

exports.taskMediaDetection={
    name:'Media_Detection',
    note:'Detect Media',
    task_script_path:'/api/ps/MediaDetector.ps1',
    setting_type:'NULL'    
};
exports.taskDeployStandardVHDImage={
    name:'taskDeployStandardVHDImage',
    note:'Deploy media',
    task_script_path:'/api/ps/VMDeployment.ps1',
    setting_type:'NULL'        
};
exports.taskVMDeployment={
    name:'VM_Deployment',
    note:'Deploy VHD to local hyper-v Host',
    task_script_path:'/api/ps/VMDeployment.ps1',
    setting_type:'NULL'    
};
exports.taskMediaInstallation={
    name:'Media_Installation',
    note:'Install Media',
    task_script_path:'\\\\nhqa-w81-q10\\v7\\Manager\\manager.main.ps1',
    setting_type:'NULL'    
};
exports.taskAPMInstall={
    name:'APM_Install',
    note:'Install APM',
    task_script_path:'\\\\nhqa-w81-q10\\v7\\Manager\\manager.main.ps1',
    setting_type:'Task.ImageDeploy',
    memory_size_mb:5*1024,
    CPU_Core:4,
    remote_vhd_path:'\\\\wuwei1\\d$\\VM_Image\\en_w2k16_dc_r2_x64_127gb.vhd',
};

exports.taskAPM_NewMediaDetection={
    name:'APM_NewMediaDetection',
    note:'Install APM',
    task_script_path:'\\\\nhqa-w81-q10\\v7\\Manager\\manager.main.ps1',
    setting_type:'NULL'
};

exports.taskMissingNote={
    name:'APM_Install',        
    task_script_path:'\\\\nhqa-w81-q10\\v7\\Manager\\manager.main.ps1',
    setting_type:'Task.ImageDeploy',
    memory_size_mb:5*1024,
    CPU_Core:4,
    remote_vhd_path:'\\\\wuwei1\\d$\\VM_Image\\en_w2k16_dc_r2_x64_127gb.vhd',
};
exports.sampleDeployStandardVHDImage={
    name:'taskDeployStandardVHDImage',
    note:'Deploy media',
    task_script_path:'/api/ps/VMDeployment@VMDeployment.ps1',
    setting_type:'NULL'        
};

exports.sampleUninstallProduct={
    name:'Uninstall_Products',
    note:'Uninstall product from the machine',
    task_script_path:'/api/ps/MediaInstallation@Uninstall_Products.ps1',
    setting_type:'NULL'
};
exports.sampleInstallMedia={
    name:'Install_Media',
    note:'Install selected media',
    task_script_path:'/api/ps/MediaInstallation@Install_Media.ps1',
    setting_type:'NULL'    
};

exports.sampleWait={
    name:'Client_Wait',
    note:'Install selected media',
    task_script_path:'/api/ps/ClientSideMachineManagement@wait.ps1',
    setting_type:'NULL'    
};
exports.sampleVHDCheckin={
    name:'VHD_Checkin',
    note:'Install selected media',
    task_script_path:'/api/ps/VMDeployment@VHD_Checkin.ps1',
    setting_type:'NULL'    
};

exports.sampleRestart={
    name:'Client_Restart',
    note:'Install selected media',
    task_script_path:'/api/ps/ClientSideMachineManagement@Restart.ps1',
    setting_type:'NULL'    
};
exports.sampleShutdown={
    name:'Client_Shutdown',
    note:'Install selected media',
    task_script_path:'/api/ps/ClientSideMachineManagement@Shutdown.ps1',
    setting_type:'NULL'    
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
};

exports.postTaskAPMNewMediaDetection=()=>{
    return exports.PostTask(exports.taskAPM_NewMediaDetection);
};
exports.posttaskAPMInstall=()=>{
    return exports.PostTask(exports.taskAPMInstall);
};