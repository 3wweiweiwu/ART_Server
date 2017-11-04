let registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');
//let taskModel=require('../../model/task/task.model.ARTServer');
let resumeSetting=function(){
    let mtell={
        vhd_serie:'2016 MTELL V10.0.3 VHD'
    };
    let apmv101={
        vhd_serie:'2016 APM V10.1 VHD'
    };
    let msc_v11={
        vhd_serie:'2016 MSC V11 VHD'
    };
    let aes_v11={
        vhd_serie:'Win2016 AES V11 VHD'
    };
    let analytics_aspenONEV10DOT0DOT3={
        vhd_serie:'Win2016 Analytics V10.0.3 VHD'
    };    
    let promv_V10_0_2={
        vhd_serie:'Win2016 ProMV V10.0.2 VHD'
    };
    let ConstantValue={
        mtell:mtell,
        apmv101:apmv101,
        msc_v11:msc_v11,
        aes_V11:aes_v11,
        analytics_aspenONEV10_0_3:analytics_aspenONEV10DOT0DOT3,
        promv_aspenONEV10_0_2:promv_V10_0_2
    };
    let updateSetting=function(blueprintName,settingObj){

        return new Promise(resolve=>{
            //this function will add all setting for resume
            let taskObj=taskSupport.sampleVHDCheckin;
            let taskName=taskObj.name;
            //check if task is valid. If task already exist, then don't do anything
            //otherwise, create a new task
            taskSupport.PostTaskWithCheck(taskObj)
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'vhd_serie',settingObj.vhd_serie);
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