let registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer');
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer');
//let taskModel=require('../../model/task/task.model.ARTServer');
let planGenerationSetting=function(){
    let _mtellSetting={
        Subtestcase_Detection:'yes',
        P4_Project_Support:'["//depot/qe/dev/AUTOMATION/MTELL/Mtell_V10.0.3/Mtell/"]',
        P4_Username:'wuwei',
        P4_Password:'P4_Password',
        P4_WorkSpaceName:'ART',
        P4_Server:'hqperforce2:1666',
        P4_Work_Space_Folder:'c:\\p4',
        Record:'{\r\n    "id":  "CQ00768180",\r\n    "Headline":  "Smoke test",\r\n    "Product":  "Aspen Supply Chain Management",\r\n    "Area":  "SCM CAPs",\r\n    "Description":  "MTELL Smoke Test Part 1"\r\n}'
    };
    let ConstantValue={
        mtellSetting:_mtellSetting,
        scm:{
            Subtestcase_Detection:'yes',
            P4_Project_Support:'["//depot/qe/dev/AUTOMATION/SCM_General/SCM_GUI/"]',
            P4_Username:'wuwei',
            P4_Password:'Changethis19',
            P4_WorkSpaceName:'ART',
            P4_Server:'hqperforce2:1666',
            P4_Work_Space_Folder:'c:\\p4',
            Record:"[\r\n    {\r\n        \"id\":  \"CQ00273405\",\r\n        \"Headline\":  \"Smoke test\",\r\n        \"Product\":  \"Aspen Supply Chain Management\",\r\n        \"Area\":  \"SCM CAPs\",\r\n        \"Description\":  \"DM Smoke test\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"SCM_Smoketest.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00448768\",\r\n        \"Headline\":  \"Smoke test\",\r\n        \"Product\":  \"Aspen Supply Chain Management\",\r\n        \"Area\":  \"SCM CAPs\",\r\n        \"Description\":  \"IP Smoke test\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"SCM_Smoketest.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00449143\",\r\n        \"Headline\":  \"Smoke test\",\r\n        \"Product\":  \"Aspen Supply Chain Management\",\r\n        \"Area\":  \"SCM CAPs\",\r\n        \"Description\":  \"DS Smoke test\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"SCM_Smoketest.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00453227\",\r\n        \"Headline\":  \"Smoke test\",\r\n        \"Product\":  \"Aspen Supply Chain Management\",\r\n        \"Area\":  \"SCM CAPs\",\r\n        \"Description\":  \"SP Smoke test\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"SCM_Smoketest.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00444259\",\r\n        \"Headline\":  \"Smoke test\",\r\n        \"Product\":  \"Aspen Supply Chain Management\",\r\n        \"Area\":  \"SCM CAPs\",\r\n        \"Description\":  \"PS Smoke test\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"SCM_Smoketest.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00441278\",\r\n        \"Headline\":  \"New UI: Generate Plan with Optimal Solution\",\r\n        \"Product\":  \"Aspen Supply Chain Planner\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"New UI: Generate Plan with Optimal Solution\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00441279\",\r\n        \"Headline\":  \"New UI: Generate Plan with Infeasible Solution\",\r\n        \"Product\":  \"Aspen Supply Chain Planner\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"New UI: Generate Plan with Infeasible Solution\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00441280\",\r\n        \"Headline\":  \"New UI: Generate Plan with Period by Period MIP Solution\",\r\n        \"Product\":  \"Aspen Supply Chain Planner\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"New UI: Generate Plan with Period by Period MIP Solution\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00441281\",\r\n        \"Headline\":  \"New UI: Generate Plan with Period by Period MIP Solution-Infeasible for initial relaxed problem\",\r\n        \"Product\":  \"Aspen Supply Chain Planner\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"New UI: Generate Plan with Period by Period MIP Solution-Infeasible for initial relaxed problem\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00441282\",\r\n        \"Headline\":  \"New UI: Generate Plan with MIP Solution for All Periods-Feasible or Infeasible\",\r\n        \"Product\":  \"Aspen Supply Chain Planner\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"New UI: Generate Plan with MIP Solution for All Periods-Feasible or Infeasible\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00443839\",\r\n        \"Headline\":  \"Generate plan - solution 1\",\r\n        \"Product\":  \"Aspen Plant Scheduler\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"Generate plan - solution 1\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00446206\",\r\n        \"Headline\":  \"New UI: Generate Plan with MIP solution for All Periods-Relaxed solution\",\r\n        \"Product\":  \"Aspen Plant Scheduler\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"New UI: Generate Plan with MIP solution for All Periods-Relaxed solution\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00446207\",\r\n        \"Headline\":  \"New UI: Generate Plan with Period by Period MIP Solution\",\r\n        \"Product\":  \"Aspen Plant Scheduler\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"New UI: Generate Plan with Period by Period MIP Solution\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00446208\",\r\n        \"Headline\":  \"New UI: Generate Plan with All Periods by uncheck \\\"Allow backorders\\\"\",\r\n        \"Product\":  \"Aspen Plant Scheduler\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"New UI: Generate Plan with All Periods by uncheck \\\"Allow backorders\\\"\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00560429\",\r\n        \"Headline\":  \"New UI: Generate Plan with Period by Period MIP Solution-Infeasible for initial relaxed problem.\",\r\n        \"Product\":  \"Aspen Plant Scheduler\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"New UI: Generate Plan with Period by Period MIP Solution-Infeasible for initial relaxed problem.\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00560443\",\r\n        \"Headline\":  \"Inventory Controls in solution controls of SP.\",\r\n        \"Product\":  \"Aspen Supply Chain Planner\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"Inventory Controls in solution controls of SP.\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00560444\",\r\n        \"Headline\":  \"Capacity Controls in solution controls of SP.\",\r\n        \"Product\":  \"Aspen Supply Chain Planner\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"Capacity Controls in solution controls of SP.\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00560445\",\r\n        \"Headline\":  \"Inventory Controls in solution controls of PS.\",\r\n        \"Product\":  \"Aspen Plant Scheduler\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"Inventory Controls in solution controls of PS.\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00560446\",\r\n        \"Headline\":  \"Capacity Controls in solution controls of PS.\",\r\n        \"Product\":  \"Aspen Plant Scheduler\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"Capacity Controls in solution controls of PS.\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00560447\",\r\n        \"Headline\":  \"Demand import options in solution controls of PS.\",\r\n        \"Product\":  \"Aspen Plant Scheduler\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"Demand import options in solution controls of PS.\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00560448\",\r\n        \"Headline\":  \"Minimum Demand Configuration in solution controls of PS.\",\r\n        \"Product\":  \"Aspen Plant Scheduler\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"Minimum Demand Configuration in solution controls of PS.\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00560449\",\r\n        \"Headline\":  \"Demand priority in solution controls of PS.\",\r\n        \"Product\":  \"Aspen Plant Scheduler\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"Demand priority in solution controls of PS.\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00560450\",\r\n        \"Headline\":  \"Backorder priority in solution controls of PS.\",\r\n        \"Product\":  \"Aspen Plant Scheduler\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"Backorder priority in solution controls of PS.\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00560451\",\r\n        \"Headline\":  \"Inventory Controls in solution controls of PS.\",\r\n        \"Product\":  \"Aspen Plant Scheduler\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"Inventory Controls in solution controls of PS.\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00560452\",\r\n        \"Headline\":  \"Production Controls in solution controls of SP.\",\r\n        \"Product\":  \"Aspen Supply Chain Planner\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"Production Controls in solution controls of SP.\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    },\r\n    {\r\n        \"id\":  \"CQ00560453\",\r\n        \"Headline\":  \"Production Controls in solution controls of PS.\",\r\n        \"Product\":  \"Aspen Plant Scheduler\",\r\n        \"Area\":  \"\",\r\n        \"Description\":  \"Production Controls in solution controls of PS.\",\r\n        \"fullname\":  \"\",\r\n        \"Script_Name\":  \"GeneratePlan.t\"\r\n    }\r\n]"
        }
    };
    let updateSetting=function(blueprintMVT,settingObj){

        return new Promise(resolve=>{
            //this function will add all setting for resume
            let taskObj=taskSupport.samplePlanGeneration;
            let taskName=taskObj.name;
            //check if task is valid. If task already exist, then don't do anything
            //otherwise, create a new task
            taskSupport.PostTaskWithCheck(taskObj)
                .then(()=>{
                    registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,registrySupport.Keys.Template,'Subtestcase_Detection',settingObj.Subtestcase_Detection);
                })
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,registrySupport.Keys.Template,'P4_Project_Support',settingObj.P4_Project_Support);
                })
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,registrySupport.Keys.Template,'P4_Username',settingObj.P4_Username);
                })  
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,registrySupport.Keys.Template,'P4_Password',settingObj.P4_Password);
                })  
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,registrySupport.Keys.Template,'P4_WorkSpaceName',settingObj.P4_WorkSpaceName);
                })  
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,registrySupport.Keys.Template,'P4_Server',settingObj.P4_Server);
                })  
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,registrySupport.Keys.Template,'P4_Work_Space_Folder',settingObj.P4_Work_Space_Folder);
                })
                .then(()=>{
                    return registrySupport.postRegistry(registrySupport.Keys.Template,blueprintMVT.name,taskName,'Record',settingObj.Record);
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
module.exports=planGenerationSetting();