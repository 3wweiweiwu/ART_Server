let registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');
//let taskControl=require('../../controllers/task/task.controllers.ARTServer');
//let taskModel=require('../../model/task/task.model.ARTServer');
let resumeSetting=function(){
    let _mtellPrestagingDeployment={
        base_vhd_path:'599c85c9a758ba2afcc18df9',
        memory_size:4*1024*1024*1024,
        cpu_cores:4,
        VM_Username:'administrator',
        VM_Pass:'Aspen100',
        Email_List:['weiwei.wu@aspentech.com','weiwei.wu@aspentech.com']
    };
    let _mtellVHDDeployment={
        base_vhd_path:'599c85c9a758ba2afcc18df9',
        memory_size:2*1024*1024*1024,
        cpu_cores:4,
        VM_Username:'administrator',
        VM_Pass:'Aspen100',
        Email_List:['weiwei.wu@aspentech.com','weiwei.wu@aspentech.com','David.Bechara@aspentech.com','Manasi.Tilwalli@aspentech.com','Sunil.Pillai@aspentech.com','Yucheng.Lai@aspentech.com']
    };
    let _mtellMVTDeployment={
        base_vhd_path:'599c85c9a758ba2afcc18df9',
        memory_size:10*1024*1024*1024,
        cpu_cores:4,
        VM_Username:'administrator',
        VM_Pass:'Aspen100',
        Email_List:['weiwei.wu@aspentech.com','weiwei.wu@aspentech.com']
    };
    let apm={
        prestaging:{
            base_vhd_path:'599c85c9a758ba2afcc18df9',
            memory_size:6*1024*1024*1024,
            cpu_cores:4,
            VM_Username:'administrator',
            VM_Pass:'Aspen100',
            Email_List:['weiwei.wu@aspentech.com']
        },
        deployment:{
            base_vhd_path:'599c85c9a758ba2afcc18df9',
            memory_size:2*1024*1024*1024,
            cpu_cores:4,
            VM_Username:'administrator',
            VM_Pass:'Aspen100',
            Email_List:['weiwei.wu@aspentech.com','Samantha.Immele@aspentech.com','Phillip.Carpenter@aspentech.com','Yucheng.Lai@aspentech.com','Sunil.Pillai@aspentech.com','Arun.Bhatia@aspentech.com','Dicson.Leung@aspentech.com','Advait.Tendulkar@aspentech.com']
        }
    };
    
    let ConstantValue={        
        mtellVHDDeployment:_mtellVHDDeployment,
        mtellMVTDeployment:_mtellMVTDeployment,
        mtellPrestagingDeployment:_mtellPrestagingDeployment,
        apm:apm
    };
    let updateSetting=function(visionName,blueprintName,settingObj){

        return new Promise(resolve=>{
            //this function will add all setting for resume
            let taskObj=taskSupport.sampleDeployStandardVHDImage;
            let taskName=taskSupport.sampleDeployStandardVHDImage.name;
            //check if task is valid. If task already exist, then don't do anything
            //otherwise, create a new task
            taskSupport.PostTaskWithCheck(taskObj)
                .then(()=>{
                    return registrySupport.postRegistry(visionName,registrySupport.Keys.Template,taskName,'base_vhd_path',settingObj.base_vhd_path);
                })
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'Email_List',JSON.stringify(settingObj.Email_List));
                })
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'cpu_cores',settingObj.cpu_cores);
                })
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'VM_Username',settingObj.VM_Username);
                })  
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'VM_Pass',settingObj.VM_Pass);
                })
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'memory_size',settingObj.memory_size);
                })
                .then(()=>{
                    resolve();
                });
        });
    };
    return {
        updateSetting:updateSetting,
        Constant:ConstantValue
    };
};
module.exports=resumeSetting();