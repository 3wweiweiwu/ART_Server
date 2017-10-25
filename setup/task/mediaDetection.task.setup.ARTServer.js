let registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');

let mediaDetectionSetting=function(){
    let mtellMediaDetection={
        family:'mtell',
        media_path:'\\\\hqfiler\\upload$\\aspenONEV10.0_CP\\Mtell',
        Media_Folder_Snapshot:'Run',
        schedule_mode:'EveryNewMedia',
        current_schedule:' '
    };
    let apm={
        family:'analytics',
        media_path:'\\\\hqfiler.corp.aspentech.com\\upload$\\aspenoneV10.1\\APM',
        Media_Folder_Snapshot:'Run',
        schedule_mode:'EveryNewMedia',
        current_schedule:' '
    };
    let msc={
        family:'msc',
        media_path:'\\\\hqfiler\\upload$\\aspenONEV11.0\\MSC',
        Media_Folder_Snapshot:'Run',
        schedule_mode:'EveryNewMedia',
        current_schedule:' '
    };
    let updateSetting=function(visionName,blueprintName,settingObj){
        return new Promise(resolve=>{
            let taskObj=taskSupport.taskMediaDetection;
            let taskName=taskObj.name;
            taskSupport.PostTaskWithCheck(taskObj)
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'family',settingObj.family);
                })                
                .then(()=>{
                    //registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMediaDetectionObj.name,taskSupport.taskMediaDetection.name,'media_path','\\\\hqfiler\\upload$\\aspenONEV10.0\\APM')
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'media_path',settingObj.media_path);
                })
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'Media_Folder_Snapshot',settingObj.Media_Folder_Snapshot);
                })
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'schedule_mode',settingObj.schedule_mode);
                })
                .then(()=>{
                    return registrySupport.postRegistry(visionName,registrySupport.Keys.Template,taskName,'current_schedule',settingObj.current_schedule);
                })                        
                .then(()=>{
                    resolve();
                });
        });

    };
    let constant={
        mtellMediaDetection:mtellMediaDetection,
        apm:apm,
        msc:msc
    };
    return {
        constant:constant,
        updateSetting:updateSetting
    };
};

module.exports=mediaDetectionSetting();