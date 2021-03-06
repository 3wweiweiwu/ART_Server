let registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');
//let taskModel=require('../../model/task/task.model.ARTServer');
let resumeSetting=function(){
    let _mtellSetting={
        iSelenium_MultiThreading_Count:1,
        iRestartAfterScripts:3,
        iMaxTrial:1,
        iErrTestCasePerPlan:3,
        iTimeout:60,
        Email_List:['weiwei.wu@aspentech.com','weiwei.wu@aspentech.com','David.Bechara@aspentech.com','Manasi.Tilwalli@aspentech.com','Sunil.Pillai@aspentech.com','Yucheng.Lai@aspentech.com']
    };
    let ConstantValue={
        mtellSetting:_mtellSetting,
        SCM:{
            iSelenium_MultiThreading_Count:1,
            iRestartAfterScripts:3,
            iMaxTrial:1,
            iErrTestCasePerPlan:3,
            iTimeout:60,
            Email_List:['weiwei.wu@aspentech.com','weiwei.wu@aspentech.com']
        },
        A1PE:{
            iSelenium_MultiThreading_Count:1,
            iRestartAfterScripts:3,
            iMaxTrial:1,
            iErrTestCasePerPlan:3,
            iTimeout:60,
            Email_List:['weiwei.wu@aspentech.com','weiwei.wu@aspentech.com']
        }
    };
    let updateSetting=function(blueprintName,settingObj){

        return new Promise(resolve=>{
            //this function will add all setting for resume
            let taskObj=taskSupport.sampleResume;
            let taskName=taskSupport.sampleResume.name;
            //check if task is valid. If task already exist, then don't do anything
            //otherwise, create a new task
            taskSupport.PostTaskWithCheck(taskObj)
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'iSelenium_MultiThreading_Count',settingObj.iSelenium_MultiThreading_Count);
                })
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'iRestartAfterScripts',settingObj.iRestartAfterScripts);
                })
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'iMaxTrial',settingObj.iMaxTrial);
                })  
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'iErrTestCasePerPlan',settingObj.iErrTestCasePerPlan);
                })  
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'iTimeout',settingObj.iTimeout);
                })  
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'Email_List',JSON.stringify(settingObj.Email_List));
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