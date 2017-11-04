let registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');
//let taskModel=require('../../model/task/task.model.ARTServer');
let resumeSetting=function(){
    let mtellMediaInstallation={
        Installation_File:'\\\\hqfiler\\upload$\\aspenONEV10.0\\APM\\V10.0_APM_Suite_174.iso',
        PRODUCT_LIST:'/Aspen Mtell;/Aspen Mtell/Aspen Mtell Suite;/Aspen Mtell/Aspen Mtell Suite/Core Applications and Services (64bit);/Aspen Mtell/Aspen Mtell Suite/Desktop Applications (64bit);/Aspen Mtell/Aspen Mtell Suite/Agent Service (64bit);/Aspen Mtell/Aspen Mtell Suite/Training Service (64bit);/Aspen Mtell/Aspen Mtell SCADA?HMI Integration;/Aspen Mtell/Aspen Mtell SCADA?HMI Integration/HMI Maintenance Gateway (64bit);/Aspen Mtell/Aspen Mtell SCADA?HMI Integration/HMI Maintenance Gateway (32bit);/Aspen Mtell/Aspen Mtell SCADA?HMI Integration/Gateway Server (32bit);/Aspen Mtell/Aspen Mtell EAM Adapters;/Aspen Mtell/Aspen Mtell EAM Adapters/Avantis EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Cityworks EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Empac EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Hansen EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Infor EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Oracle JD Edwards EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Mainsaver EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Maintenance Connection EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/IBM Maximo EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/MP2 EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Oracle WAM Adapter (64bit);/Aspen Mtell/Aspen Mtell EAM Adapters/Tabware EAM Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters;/Aspen Mtell/Aspen Mtell Sensor Adapters/Honeywell PHD Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters/OpenTSDB Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters/OSIsoft PI Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Sensor Adapters/Aptitude Observer Sensor Adapter (64bit);/Aspen Mtell/Aspen Mtell Log Manager;/Aspen Mtell/Aspen Mtell Log Manager/Log Manager (64bit)',
        Product_Folder_In_Installation_Package:'aspenONE_V*_APM',
        Product_Verification:['Aspen Mtell Maintenance Connection EAM Adapter (64bit)','Aspen Mtell Infor EAM Adapter (64bit)','Aspen Mtell Tabware EAM Adapter (64bit)','Aspen Mtell Log Manager (64bit)','Aspen Mtell Agent Service (64bit)','Aspen Mtell Gateway Server (32bit)','Aspen Mtell Empac EAM Adapter (64bit)','Aspen Mtell Training Service (64bit)','Aspen Mtell Avantis EAM Adapter (64bit)','Aspen Mtell Aptitude Observer Sensor Adapter (64bit)','Aspen Mtell MP2 EAM Adapter (64bit)','Aspen Mtell IBM Maximo EAM Adapter (64bit)','Aspen Mtell Core Applications and Services (64bit)','Aspen Mtell Oracle JD Edwards EAM Adapter (64bit)','Aspen Mtell OSIsoft Pi Sensor Adapter (64bit)','Aspen Mtell HMI Maintenance Gateway (32bit)','Aspen Mtell OpenTSDB Sensor Adapter (64bit)','Aspen Mtell Honeywell PHD Sensor Adapter (64bit)','Aspen Mtell Cityworks EAM Adapter (64bit)','Aspen Mtell HMI Maintenance Gateway (64bit)','Aspen Mtell Hansen EAM Adapter (64bit)','Aspen Mtell Mainsaver EAM Adapter (64bit)'],
        
    };
    let APMMediaInstallation={
        Installation_File:'\\\\hqfiler\\upload$\\aspenONEV10.0\\APM\\V10.0_APM_Suite_174.iso',
        PRODUCT_LIST:'/Aspen Asset Analytics;/Aspen Fidelis Reliability;/Aspen ProMV;/Aspen ProMV/Online Server Application;/Aspen ProMV/Desktop Application',
        Product_Folder_In_Installation_Package:'aspenONE_V*_APM',
        Product_Verification:['Aspen Process Explorer','Analytics','AspenProMV'],
        

    };
    let Analytics_CP={
        Installation_File:'\\\\hqfiler\\upload$\\aspenONEV10.0\\APM\\V10.0_APM_Suite_174.iso',
        PRODUCT_LIST:'/Aspen Asset Analytics;/aspenONE Shared Components',
        Product_Folder_In_Installation_Package:'aspenONE_V*_APM',
        Product_Verification:['Analytics'],
        

    };    
    let ProMV_CP={
        Installation_File:'\\\\hqfiler\\upload$\\aspenONEV10.0\\APM\\V10.0_APM_Suite_174.iso',
        PRODUCT_LIST:'/Aspen Asset Analytics;/aspenONE Shared Components;/Aspen ProMV/Online Server Application;/Aspen ProMV/Desktop Application',
        Product_Folder_In_Installation_Package:'aspenONE_V*_APM',
        Product_Verification:['AspenProMV'],
    };
    let MSCInstallation={
        Installation_File:'\\\\hqfiler\\upload$\\aspenONEV10.0\\APM\\V10.0_APM_Suite_174.iso',
        PRODUCT_LIST:'/aspenONE Advanced Process Control Family(32-bit);/aspenONE Advanced Process Control Family(32-bit)/Aspen APC Desktop;/aspenONE Advanced Process Control Family(32-bit)/Aspen APC Online;/aspenONE Advanced Process Control Family(32-bit)/Aspen APC Performance Monitor;/aspenONE Advanced Process Control Family(32-bit)/Aspen APC Web Server;/aspenONE Advanced Process Control Family(32-bit)/Aspen Process Recipe Manager and Aspen Process Sequencer Desktop;/aspenONE Advanced Process Control Family(32-bit)/Aspen Process Recipe Manager and Aspen Process Sequencer Desktop/Aspen Process Recipe Explorer;/aspenONE Advanced Process Control Family(32-bit)/Aspen Process Recipe Manager and Aspen Process Sequencer Desktop/Aspen Process Recipe Server;/aspenONE Advanced Process Control Family(32-bit)/Aspen Process Recipe Manager and Aspen Process Sequencer Desktop/Aspen Process Sequencer;/aspenONE Advanced Process Control Family(32-bit)/Aspen Process Recipe Manager and Aspen Process Sequencer Desktop/Aspen Process Sequencer Interface to IP21;/aspenONE Advanced Process Control Family(32-bit)/Aspen Process Recipe Manager and Aspen Process Sequencer Desktop/Aspen Process Recipe External Interface;/aspenONE Manufacturing Execution Systems;/aspenONE Manufacturing Execution Systems/Aspen Web Server(64-bit);/aspenONE Manufacturing Execution Systems/Aspen Desktop Applications;/aspenONE Manufacturing Execution Systems/Aspen Administration Tools;/aspenONE Manufacturing Execution Systems/Aspen InfoPlus.21 Server(64-bit);/aspenONE Manufacturing Execution Systems/Aspen InfoPlus.21 Server(32-bit);/aspenONE Manufacturing Execution Systems/Aspen Cim-IO Interfaces;/aspenONE Manufacturing Execution Systems/Aspen Cim-IO Interfaces/OPC Interfaces;/aspenONE Manufacturing Execution Systems/Aspen Cim-IO Interfaces/All Other Interfaces;/aspenONE Manufacturing Execution Systems/Aspen Production Record Manager Server(64-bit);/aspenONE Manufacturing Execution Systems/Aspen Production Record Manager Server(32-bit);/aspenONE Manufacturing Execution Systems/Aspen Batch Interfaces(64-bit);/aspenONE Manufacturing Execution Systems/Aspen Batch Interfaces(32-bit);/aspenONE Manufacturing Execution Systems/Aspen Production Execution Manager Server;/aspenONE Manufacturing Execution Systems/Aspen Infrastructure;/aspenONE Manufacturing Execution Systems/Aspen Local Security Server;/aspenONE Plant Operations Family(32-bit);/aspenONE Plant Operations Family(32-bit)/Aspen Operations Reconciliation and Accounting Server;/aspenONE Plant Operations Family(32-bit)/Aspen Tank and Operations Manager Server;/aspenONE Plant Operations Family(32-bit)/Aspen Tank and Operations Manager Desktop Apps;/aspenONE Plant Operations Family(32-bit)/Aspen Operations Reconciliation and Accounting Desktop Apps;/aspenONE Petroleum Supply Chain and Distribution Family;/aspenONE Petroleum Supply Chain and Distribution Family/Aspen Petroleum Scheduler & Aspen Refinery Multi-Blend Optimizer;/aspenONE Petroleum Supply Chain and Distribution Family/Aspen Petroleum Scheduler & Aspen Refinery Multi-Blend Optimizer/EIF and mMDM Adapters;/aspenONE Petroleum Supply Chain and Distribution Family/Aspen PIMS;/aspenONE Petroleum Supply Chain and Distribution Family/Aspen Unified PIMS;/aspenONE Petroleum Supply Chain and Distribution Family/Aspen Petroleum Supply Chain Planner;/aspenONE Petroleum Supply Chain and Distribution Family/Aspen Petroleum Supply Chain Planner/EIF and mMDM Adapters;/aspenONE Petroleum Supply Chain and Distribution Family/Aspen Fleet Optimizer(32-bit);/aspenONE Petroleum Supply Chain and Distribution Family/Aspen Fleet Optimizer(32-bit)/Aspen Fleet Optimizer;/aspenONE Petroleum Supply Chain and Distribution Family/Aspen Fleet Optimizer(32-bit)/Link & Exchange Services;/aspenONE Petroleum Supply Chain and Distribution Family/Aspen Fleet Optimizer(32-bit)/Order Manager - Web;/aspenONE Petroleum Supply Chain and Distribution Family/Aspen Fleet Optimizer(32-bit)/AFO Map Monitor;/aspenONE Supply Chain Management(64-bit);/aspenONE Supply Chain Management(64-bit)/Aspen SCM;/aspenONE Supply Chain Management(64-bit)/Aspen SCM Applications;/aspenONE Supply Chain Management(64-bit)/Aspen Collaborative Forecasting;/aspenONE Supply Chain Management(64-bit)/Aspen Scheduling Insight Planning Board;/aspenONE Supply Chain Management(64-bit)/Aspen Scheduling Insight Planning Board/Web Application;/aspenONE Supply Chain Management(64-bit)/Aspen Scheduling Insight Planning Board/Database Scripts;/aspenONE Supply Chain Management(64-bit)/Aspen Scheduling Insight Planning Board/Integration Service;/aspenONE Supply Chain Management(64-bit)/Aspen Schedule Explorer;/aspenONE Supply Chain Management(64-bit)/Aspen Schedule Explorer/Web Application;/aspenONE Supply Chain Management(64-bit)/Aspen Schedule Explorer/Database Scripts;/aspenONE Supply Chain Management(64-bit)/Aspen Supply Chain Analytics - Oracle;/aspenONE Supply Chain Management(64-bit)/Aspen Supply Chain Analytics - SQL Server;/aspenONE Supply Chain Management(32-bit);/aspenONE Supply Chain Management(32-bit)/Aspen Supply Chain Connect;/aspenONE Supply Chain Management(32-bit)/Aspen Supply Chain Connect/Supply Chain Connect Web Apps;/aspenONE Supply Chain Management(32-bit)/Aspen Supply Chain Connect/Supply Chain Connect Data Repository;/aspenONE Supply Chain Management(32-bit)/Aspen Supply Chain Connect/Supply Chain Connect ETL Repository;/aspenONE Supply Chain Management(32-bit)/Aspen Supply Chain Connect/Supply Chain Connect Documentation;/aspenONE Supply Chain Management(32-bit)/Aspen Supply Chain Connect/Supply Chain Connect Message Service;/aspenONE Infrastructure Family(64-bit);/aspenONE Infrastructure Family(64-bit)/Aspen Integration Foundation;/aspenONE Infrastructure Family(64-bit)/Aspen Integration Foundation/mMDM;/aspenONE Infrastructure Family(64-bit)/Aspen Integration Foundation/mMDM Web Services;/aspenONE Infrastructure Family(64-bit)/Aspen Integration Foundation/EIF;/aspenONE Infrastructure Family(64-bit)/Aspen Reporting Framework;/aspenONE Framework(32-bit);/aspenONE Framework(32-bit)/AFW Server Components;/aspenONE Framework(32-bit)/AFW Server Components/File Repository Server;/aspenONE Framework(32-bit)/AFW Server Components/User Group Sync Admin;/aspenONE Framework(32-bit)/AFW Client Components;/aspenONE Framework(32-bit)/AFW Client Components/User Group Sync;/aspenONE Diagnostics(32-bit)',
        Product_Folder_In_Installation_Package:'aspenONE_V*_MSC_*',
        Product_Verification:['Aspen SCM'],
        
    };
    let AES_Installation={
        Installation_File:'\\\\hqfiler\\upload$\\aspenONEV10.0\\APM\\V10.0_APM_Suite_174.iso',
        PRODUCT_LIST:'/Process Modeling (Aspen Plus);/Process Modeling (Aspen HYSYS);/Aspen Exchanger Design & Rating;/Aspen Economic Evaluation;/Aspen OnLine (Plant Data);/Aspen Basic Engineering;/Aspen Basic Engineering/Aspen Basic Engineering End-User Tools;/Aspen Basic Engineering/Aspen Basic Engineering Configuration Tools;/Server Products and Tools;/Server Products and Tools/Aspen Basic Engineering Server;/Server Products and Tools/Aspen Basic Engineering Server/Aspen Basic Engineering Server Solo Client;/Server Products and Tools/Aspen Basic Engineering Server/Aspen Basic Engineering Server Standalone;/Server Products and Tools/Aspen Remote Simulation Service;/Server Products and Tools/Aspen Remote Simulation Service 64-bit;/Server Products and Tools/Aspen Properties Enterprise Database Server',
        Product_Folder_In_Installation_Package:'aspenONE_V*_ENG*',
        Product_Verification:['Aspen Plus'],
        
    };       
    let ConstantValue={
        mtellMediaInstallation:mtellMediaInstallation,
        APM:APMMediaInstallation,
        MSC:MSCInstallation,
        aes:AES_Installation,
        Analytics_CP:Analytics_CP,
        ProMV_CP:ProMV_CP

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