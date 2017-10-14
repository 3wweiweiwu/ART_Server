let registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');
//let taskModel=require('../../model/task/task.model.ARTServer');
let resumeSetting=function(){
    let mtellMediaInstallation={
        Installation_File:'\\\\hqfiler\\upload$\\aspenONEV10.0\\APM\\V10.0_APM_Suite_174.iso',
        PRODUCT_LIST:'/Aspen Mtell;/Aspen Mtell/Aspen Mtell Suite;/Aspen Mtell/Aspen Mtell Suite/Core Applications and Services (64bit);/Aspen Mtell/Aspen Mtell Suite/Desktop Applications (64bit);/Aspen Mtell/Aspen Mtell Suite/Agent Service (64bit);/Aspen Mtell/Aspen Mtell Suite/Training Service (64bit);/Aspen Mtell/Aspen Mtell SCADA?HMI Integration;/Aspen Mtell/Aspen Mtell SCADA?HMI Integration/HMI Maintenance Gateway (64bit);/Aspen Mtell/Aspen Mtell SCADA?HMI Integration/HMI Maintenance Gateway (32bit);/Aspen Mtell/Aspen Mtell SCADA?HMI Integration/Gateway Server (32bit);/Aspen Mtell/Aspen Mtell EAM Adapters;/Aspen Mtell/Aspen Mtell EAM Adapters/Avantis EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Cityworks EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Empac EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Hansen EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Infor EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Oracle JD Edwards EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Mainsaver EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Maintenance Connection EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/IBM Maximo EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/MP2 EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Oracle WAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Tabware EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters;/Aspen Mtell/Aspen Mtell Sensor Adapters/Honeywell PHD Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters/OpenTSDB Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters/OSIsoft PI Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters/Aptitude Observer Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Log Manager;/Aspen Mtell/Aspen Mtell Log Manager/Log Manager (64bit)',
        Product_Folder_In_Installation_Package:'aspenONE_V*_APM',
        Product_Verification:['Aspen Mtell Maintenance Connection EAM Adapter (64bit)','Aspen Mtell Infor EAM Adapter (64bit)','Aspen Mtell Tabware EAM Adapter (64bit)','Aspen Mtell Log Manager (64bit)','Aspen Mtell Agent Service (64bit)','Aspen Mtell Gateway Server (32bit)','Aspen Mtell Empac EAM Adapter (64bit)','Aspen Mtell Training Service (64bit)','Aspen Mtell Avantis EAM Adapter (64bit)','Aspen Mtell Aptitude Observer Sensor Adapter (64bit)','Aspen Mtell MP2 EAM Adapter (64bit)','Aspen Mtell IBM Maximo EAM Adapter (64bit)','Aspen Mtell Core Applications and Services (64bit)','Aspen Mtell Oracle JD Edwards EAM Adapter (64bit)','Aspen Mtell OSIsoft Pi Sensor Adapter (64bit)','Aspen Mtell HMI Maintenance Gateway (32bit)','Aspen Mtell OpenTSDB Sensor Adapter (64bit)','Aspen Mtell Honeywell PHD Sensor Adapter (64bit)','Aspen Mtell Cityworks EAM Adapter (64bit)','Aspen Mtell HMI Maintenance Gateway (64bit)','Aspen Mtell Hansen EAM Adapter (64bit)','Aspen Mtell Mainsaver EAM Adapter (64bit)']        
    };
    let APMMediaInstallation={
        Installation_File:'\\\\hqfiler\\upload$\\aspenONEV10.0\\APM\\V10.0_APM_Suite_174.iso',
        PRODUCT_LIST:'/Aspen Asset Analytics;/Aspen Fidelis Reliability;/Aspen ProMV;/Aspen ProMV/Online Server Application;/Aspen ProMV/Desktop Application',
        Product_Folder_In_Installation_Package:'aspenONE_V*_APM',
        Product_Verification:['Aspen Process Explorer','Analytics','AspenProMV']
    };
    let ConstantValue={
        mtellMediaInstallation:mtellMediaInstallation,
        APM:APMMediaInstallation

    };
    let updateSetting=function(blueprintName,settingObj){

        return new Promise(resolve=>{
            //this function will add all setting for resume
            let taskObj=taskSupport.sampleInstallMedia;
            let taskName=taskObj.name;
            //check if task is valid. If task already exist, then don't do anything
            //otherwise, create a new task
            taskSupport.PostTaskWithCheck(taskObj)
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'Installation_File',settingObj.Installation_File);
                })
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'PRODUCT_LIST',settingObj.PRODUCT_LIST);
                    
                })
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'Product_Folder_In_Installation_Package',settingObj.Product_Folder_In_Installation_Package);
                })
                .then(()=>{
                    
                    let dataJson=JSON.stringify(settingObj.Product_Verification);
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintName,taskName,'Product_Verification',dataJson);
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