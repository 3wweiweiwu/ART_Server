let registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');
//let taskModel=require('../../model/task/task.model.ARTServer');
let resumeSetting=function(){
    let uninstallAll={
        Product_Uninstall_List:['all','all']
    };
    let ConstantValue={
        uninstallAll:uninstallAll
    };
    let updateSetting=function(blueprintName,settingObj){

        return new Promise(resolve=>{
            //this function will add all setting for resume
            let taskObj=taskSupport.sampleUninstallProduct;
            let taskName=taskObj.name;
            //check if task is valid. If task already exist, then don't do anything
            //otherwise, create a new task
            taskSupport.PostTaskWithCheck(taskObj)
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'Product_Uninstall_List',JSON.stringify(settingObj.Product_Uninstall_List));
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