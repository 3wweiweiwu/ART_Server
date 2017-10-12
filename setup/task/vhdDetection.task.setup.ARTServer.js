let registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');
//let taskControl=require('../../controllers/task/task.controllers.ARTServer');
//let taskModel=require('../../model/task/task.model.ARTServer');
let vhdDetection=function(){
    let _mtellDetection={
        series:'2016 MTELL V10.0.3 VHD',
    };

    
    let ConstantValue={
        mtellDetection:_mtellDetection
        
    };
    let updateSetting=function(blueprintName,settingObj){

        return new Promise(resolve=>{
            //this function will add all setting for resume
            let taskObj=taskSupport.sampleVHDDetection;
            let taskName=taskObj.name;
            //check if task is valid. If task already exist, then don't do anything
            //otherwise, create a new task
            taskSupport.PostTaskWithCheck(taskObj)
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'series',settingObj.series)                    
                })
                .then(()=>{
                    resolve();
                })
        });
    };
    return {
        updateSetting:updateSetting,
        Constant:ConstantValue
    };
};
module.exports=vhdDetection();