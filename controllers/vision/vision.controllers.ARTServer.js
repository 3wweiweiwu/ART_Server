var visionModel = require('../../model/vision/vision.model.ARTServer');
let lockControl=require('../common/lock.common.controllers.ARTServer');
var projectControl = require('../project/project.controllers.ARTServer');
let projectBlueprintModel = require('../../model/project/projectBlueprint.model.ARTServer');
let blueprintControl = require('../project/projectBlueprint.controllers.ARTServer');

let dormControl = require('../../controllers/organization/dormControl');
let standardError = require('../common/error.controllers.ARTServer');
// const UpdateBasicVision = function (req, cb = () => { }) {
//     return new Promise((resolve, reject) => {
//         visionModel.findOneAndUpdate({ name: req.body.name }, {
//             name: req.body.name,
//             note: req.body.note,
//             status: req.body.status
//         }
//             , { upsert: true, new: true }
//             , (err, res) => {
//             if (err) {
//                 reject(err);
//                 cb(err, null);
//             }
//             else {
//                 resolve(res);
//                 cb(null, res);
//             }
//         });
//     });
// };
const CreateVisionError = standardError;
const CreateBasicVision = function (req, cb = () => { }) {
    return new Promise((resolve, reject) => {
        visionModel
            .remove({ name: req.body.name })
            .exec(() => {
                let vision = new visionModel({
                    name: req.body.name,
                    note: req.body.note,
                    key_projects: [],
                    current_projects: [],
                    history: [],
                    registry: [],
                    status: req.body.status,
                    project_schedule: []
                });
                vision.save((err) => {
                    if (err) {
                        reject(err);
                        return cb(err);
                    }
                    else {
                        resolve(vision._id);
                        return cb(null);
                    }
                });
            });
    });
};


exports.getVision = function (query, cb = () => { }) {
    return new Promise((resolve, reject) => {
        visionModel
            .find(query)
            .populate({
                path: 'key_projects'
            })
            .populate({ 
                path: 'current_projects._project',
                populate:{
                    path:'_bluePrint',model:'Project.Blueprint'
                }
            })
            .populate({
                path:'current_projects._project',
                populate:{
                    path:'host',model:'Dorm'
                }
            })
            .populate({ path: 'project_schedule.project_blueprint' })
            .populate({ path: 'project_schedule.machine_demand.dorm' })
            .populate({path:'project_schedule.next_project.blueprint'})
            .populate({path:'info.project_schedule.vid_group_info.project_blueprint'})
            .exec((err, res) => {
                if (err) {
                    reject(err);
                    return cb(err, res);
                }
                else {
                    resolve(res);
                    return cb(err, res);
                }

            });
    });
};

// const isVisionExists = function (visonResult, cb = () => { }) {
//     return new Promise((resolve, reject) => {
//         if (visonResult.length == 0) {
//             let errInfo = {
//                 result: 'error',
//                 detail: 'invalid argument, fail to find vision name'
//             };
//             reject(errInfo);
//             return cb(errInfo);
//         }
//         else {
//             resolve(visonResult);
//             return cb(null, visonResult);
//         }
//     });
// };




exports.get = function (req, res, next, query) {
    exports.getVision(query)
        .then((fb) => {
            res.json(fb);
        })
        .catch((err) => {
            res.status(500).json(err);
        });
};

exports.create = function (req, res) {
    CreateBasicVision(req)
        .then((feedback) => {
            res.json(feedback);
        })
        .catch((err) => {
            res.status(500).json(err);
        });
};

const IsBlueprintValid=(visionList,blueprint)=>{
    return (new Promise((resolve,reject)=>{
        if(visionList.length!=1){
            reject(standardError('unable to find vision specified'),400);
            return;
        }
        //get the first vision
        let vision=visionList[0];

        let projectSchedule=vision.project_schedule.find(item=>{return item.project_blueprint.name==blueprint;});                    
        //if we cannot find the projectSchedule specified, then quit
        if(projectSchedule==null){
            reject(standardError(`unable to find blueprint specified ${blueprint} in the vision`,400));
            return;
        }
        else{
            resolve(vision);
        }
    }));
};
exports.IsBlueprintInProjectScheduleValid=function(vision,blueprint){
    return new Promise((resolve,reject)=>{
        exports.getVision({name:vision})
            .then(visionList=>{
                return IsBlueprintValid(visionList,blueprint);
            })
            .then(vision=>{
                resolve(vision);
            })
            .catch(err=>{
                reject(err);
            });
    });
};
const AddProjectIntoVision=(visionName,projectId)=>{
    return new Promise((resolve,reject)=>{

        //add projectId into vision
        visionModel.update(
            { name: visionName },
            { $addToSet: { current_projects: { _project: projectId } } },
            (err) => {
                if (err) {
                    reject(standardError(err, 500));
                }
                else {
                    resolve({ projectId: projectId });
                }
            }
        );

    });
};

//TODO: if there is another project in the vision that have the same vid,
//then simply mark previous project as pending retire
exports.CreateNewProjectAndAddToVision = function (visionName, blueprint) {
    return new Promise((resolve, reject) => {
        projectControl.CreateNewProject(blueprint)
            .then(projectId => {
                return AddProjectIntoVision(visionName,projectId);
            })
            .then(projectId=>{
                resolve(projectId);
            })
            .catch(err=>{
                reject(err);
            });
    });
};

exports.postNewProject = function (req, res) {

    checkVisionNameValid(req.params.vision)
        .then(() => {
            //check if blueprint is valid
            return blueprintControl.isBlueprintValid(req.params.blueprint);
        })
        .then(() => {
            //remove key blueprint
            return exports.CreateNewProjectAndAddToVision(req.params.vision, req.params.blueprint);
        })
        .then((raw) => {
            
            res.json(raw);
        })
        .catch((err) => {
            res.status(err.status).json(err);
        });

};


// exports.putProject = function (req, res) {
//     exports.getVision({ name: req.params.vision_name })
//         .then(isVisionExists(result))
//         .then(() => {
//             //do nothing
//         })
//         .catch((err) => {
//             res.status(400).json(err);
//         });
// };
const checkVisionNameValid = function (name, cb = () => { }) {
    return new Promise((resolve, reject) => {
        let query = {
            name: name,
        };
        exports.getVision(query)
            .then((vision) => {
                if (vision.length == 0) {
                    //if no vision found, then return with error
                    let err = {
                        result: 'error',
                        status: 400,
                        note: 'unable to find vision specified'
                    };
                    reject(err);
                    return cb(err);
                }
                else if (vision.length != 1) {
                    //if more than 1 vision found, then flag with error
                    let err = {
                        result: 'error',
                        status: 500,
                        note: 'there are more than one vision with the same name'
                    };
                    reject(err);
                    return cb(err);
                }
                else {
                    resolve(vision);
                    return cb(null, query);
                }
            });

    });
};


exports.PutKeyProject = function (req, res) {

    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            //if there is only 1 vision found, then validate projectBlueprint

            projectBlueprintModel
                .findOne({ name: req.params.projectBlueprint })
                .exec((err, blueprint) => {
                    if (err) {
                        res.status(400).json({
                            result: 'error',
                            note: err
                        });
                    }
                    else if (blueprint == null) {
                        //if no blueprint is found, then return error 400
                        res.status(400).json({
                            result: 'error',
                            note: 'The project blueprint specified is incorrect'
                        });
                    }
                    else {
                        //if blueprint is found, then link blueprint with project
                        visionModel.update({ name: req.params.vision_name },
                            { $push: { key_projects: { project_blueprint: blueprint._id } } }
                            , { multi: true }
                            , (err) => {
                                if (err) {
                                    res.status(500).json({
                                        result: 'error',
                                        note: err
                                    });
                                }
                                else {
                                    res.json({
                                        result: 'ok'
                                    });
                                }
                            });                        

                    }

                });
        })
        .catch(err => {
            res.status(err.status).json(err);
        });

};

exports.PutRegistry = function (req, res) {
    checkVisionNameValid(req.params.vision_name)
        .then(query => {
            let queryResult = query[0];
            queryResult.registry = queryResult.registry.filter((item) => { return item.key != req.body.key; });
            queryResult.registry.push({
                key: req.body.key,
                value: req.body.value
            });
            queryResult.save((err) => {
                if (err) {
                    res.status(500).json(err);
                }
                else {
                    res.json({ result: 'ok' });
                }
            });
        })
        .catch(err => {
            res.status(err.status || 500).json(err);
        });
};

exports.GetRegistry = function (req, res) {
    visionModel.findOne({ name: req.params.vision_name, 'registry.key': req.params.key })
        .exec((err, vision) => {
            if (err) {
                res.status(500).json(err);
            }
            else if (vision != null) {
                //if there is such a vision
                res.json(vision.registry.filter(value => { return value.key == req.params.key; })[0]);
            }
            else {
                res.status(400).json({ value: null });
            }
        });
};


let CreateNewBlueprintScheduleWithoutLock = function (visions, blueprintName, cb = () => { }) {
    return new Promise((resolve, reject) => {
        //validate blueprint status

        blueprintControl.queryBlueprint(blueprintName)
            .then(blueprint => {
                //if blueprint is not found, then return error
                if (blueprint == null) {
                    let result = {
                        status: 400,
                        err: 'unable to find blueprint specified'
                    };
                    reject(result);
                    return cb(result);
                }

                //find out schedule for specific blueprint
                let vision = visions[0];
                let result = vision.project_schedule.find(schedule => { 
                    return schedule.project_blueprint.name === blueprintName; 
                });
                if (result == null) {
                    let schedule = {
                        project_blueprint: blueprint._id,
                        server_ask: 1,
                        machine_demand: [],
                        next_project: []
                    };
                    visionModel.findByIdAndUpdate(vision._id,
                        {$push:{project_schedule:schedule}},
                        err=>{
                            if(err){
                                reject(standardError(err,500));
                                return cb(err);
                            }
                            else{
                                resolve();
                                return cb(null);
                            }
                        }
                    );

                }
                else {
                    //if there is existing project schedule, then simply return
                    resolve();
                    return cb(null);
                }

            });



    });
};

exports.CreateNewBlueprintSchedule =function(visionName,blueprintName){
    return new Promise((resolve,reject)=>{
        let lockName=`CreateNewBlueprintSchedule =function(${visionName},${blueprintName})`;
        lockControl.Aquire(lockName)
            .then(()=>{
                return checkVisionNameValid(visionName)
            })
            .then((visions)=>{
                return CreateNewBlueprintScheduleWithoutLock(visions,blueprintName);
            })            
            .then(()=>{
                lockControl.Release(lockName);
                resolve();
            })
            .catch(err=>{
                lockControl.Release(lockName);
                reject(err);
            });
    });
}

exports.PutBlueprint = function (req, res) {

    exports.CreateNewBlueprintSchedule(req.params.vision_name, req.params.blueprint)
        .then(() => {
            res.json();
        })
        .catch(err => { res.status(err.status).json(err); });
};
exports.UpdateServerAsk = function (vision, blueprint, serverAsk, cb = () => { }) {
    return new Promise((resolve, reject) => {


        visionModel.findOne({
            name: vision
        })
            .populate('project_schedule.project_blueprint')
            .exec((err, vision) => {
                if (err) {

                    reject(CreateVisionError(err, 500));
                    return cb(CreateVisionError(err, 500));
                }
                else {
                    //update server ask for specific schedule
                    let scheduleIndex = vision.project_schedule.findIndex(schedule => { return schedule.project_blueprint.name === blueprint; });
                    vision.project_schedule[scheduleIndex].server_ask = serverAsk;
                    vision.save((err) => {
                        if (err) {
                            if(err.name=='VersionError'){
                                return exports.UpdateServerAsk(vision.name)
                                    .then(()=>{
                                        resolve();
                                    })
                                    .catch(err=>{
                                        reject(CreateVisionError(err, 500));
                                        return cb(CreateVisionError(err, 500));   
                                    });
                            }
                            else{
                                reject(CreateVisionError(err, 500));
                                return cb(CreateVisionError(err, 500));
                            }

                        }
                        else {
                            resolve();
                            return cb();
                        }
                    });

                }
            });

    });

};
exports.putBlueprintServerAsk = function (req, res) {
    //vision check
    

    exports.CreateNewBlueprintSchedule(req.params.vision_name, req.params.blueprint)        
        .then(() => {
            //update server ask
            return exports.UpdateServerAsk(req.params.vision_name, req.params.blueprint, req.params.ask);
        })
        .then(() => {
            //return succss indicator
            res.json();
        })
        .catch(err => { 
            res.status(err.status).json(err); 
        });
};
let UpdateBlueprintMachineInstance_UpdateVision=function(visionName,machineInfo,ask,listVid,groupNumber,blueprint,machine){
    return new Promise((resolve,reject)=>{
        //machine found, then try to find blueprint
        visionModel.findOne({name: visionName})
            .populate({ path: 'current_projects' })
            .populate({ path: 'project_schedule.project_blueprint' })
            .populate({ path: 'project_schedule.machine_demand.dorm' })
            .exec((err, vision) => {
                if (err) {
                //defend query error
                    reject(CreateVisionError(err, 500));
                    return;
                }
                else {
                //find specific blueprint index
                    let scheduleIndex = vision.project_schedule.findIndex(schedule => { return schedule.project_blueprint.name === blueprint; });
                    //find specific machine index
                    let machineIndex = vision.project_schedule[scheduleIndex].machine_demand.findIndex(machineInstance => { return machineInstance.dorm.name === machine; });
                    if (machineIndex == -1) {
                    //if it is a new machine, then we push the machine into array
                        let machine_demand = {
                            dorm: machineInfo._id,
                            instance: ask,
                            vid_list:listVid,
                            group_number:groupNumber
                        };
                        vision.project_schedule[scheduleIndex].machine_demand.push(machine_demand);
                    }
                    else {
                    //if machine found, then update the machine info
                        vision.project_schedule[scheduleIndex].machine_demand[machineIndex].instance = ask;
                        vision.project_schedule[scheduleIndex].machine_demand[machineIndex].vid_list = listVid;
                        vision.project_schedule[scheduleIndex].machine_demand[machineIndex].group_number=groupNumber;
                    }
                
                    vision.save((err) => {
                        if (err) {
                            if(err.name=='VersionError'){
                                return UpdateBlueprintMachineInstance_UpdateVision(visionName,machineInfo,ask,listVid,groupNumber)
                                    .then(()=>{
                                        resolve();
                                    })
                                    .catch(()=>{
                                        reject(err);        
                                    });
                            }
                            else{
                                reject(err);
                            }
                            //server error is detected in save
                            
                        }
                        else {
                            resolve();
                        }
                    });

                }
            });
    });
};
exports.UpdateBlueprintMachineInstance = function (vision, blueprint, machine, ask,listVid,groupNumber) {
    return new Promise((resolve, reject) => {
        dormControl.GetDorm(machine)
            .then((machineInfo) => {
                //validate machine
                if (machineInfo == null) {
                    //if no machine found, then throw no-machine error
                    let result = CreateVisionError('cannot find machine specified', 400);
                    reject(result);
                    return;
                }

                UpdateBlueprintMachineInstance_UpdateVision(vision,machineInfo,ask,listVid,groupNumber,blueprint,machine)
                    .then(()=>{
                        resolve();
                    })
                    .catch((err)=>{
                        reject(CreateVisionError(err, 500));
                    });


            });




    });
};
exports.putBlueprintMachineInstance = function (req, res) {
    //vision check

    exports.CreateNewBlueprintSchedule(req.params.vision_name, req.params.blueprint)
        .then(() => {
            //update machine instance

            return exports.UpdateBlueprintMachineInstance(req.params.vision_name, req.params.blueprint, req.params.machine, req.params.ask, req.body.vid_list);
        })
        .then(() => {
            //return succss indicator
            res.json();
        })
        .catch(err => { res.status(err.status).json(err); });
};

let UpdateNextBlueprint_SaveVision=function(vision_name,blueprints,nextBlueprint,baseBlueprint){
    return new Promise((resolve,reject)=>{
        //get vision and update base blueprint specified
        visionModel.findOne({ name: vision_name })
            .populate('project_schedule.project_blueprint')
            .exec((err, vision) => {
                if (err) {
                    reject(CreateVisionError(500, err));
                }
                else {
                    let nextBlueprintDoc = blueprints.find(item => { return item.name == nextBlueprint; });
                    let scheduleIndex = vision.project_schedule.findIndex(item => { return item.project_blueprint.name == baseBlueprint; });
                    
                    //if there is existing next project, then quit the loop because we don't want to add same task twice
                    let nextProject=vision.project_schedule[scheduleIndex].next_project.find(item=>{
                        return item.blueprint.toString()==nextBlueprintDoc._id.toString();
                      
                    });
                    if(nextProject!=null){
                        resolve();
                        return;
                    }
                    
                    vision.project_schedule[scheduleIndex].next_project.push({ blueprint: nextBlueprintDoc._id });
                    vision.save((err) => {
                        if (err) {
                            if(err.name=='VersionError'){
                                return UpdateNextBlueprint_SaveVision(vision_name,blueprints,nextBlueprint,baseBlueprint)
                                    .then(()=>{
                                        resolve();
                                    })
                                    .catch(()=>{
                                        reject(standardError(err,500));        
                                    });
                            }
                            else{
                                reject(standardError(err,500));
                            }
                            
                        }
                        else {
                            resolve();
                        }
                    });

                }

            });    
    });

};
exports.UpdateNextBlueprint = function (vision_name, baseBlueprint, nextBlueprint) {
    return new Promise((resolve, reject) => {
        let lockName=`UpdateNextBlueprint = function (${vision_name}, ${baseBlueprint}, ${nextBlueprint})`;
        lockControl.Aquire(lockName)
            .then(()=>{
                return blueprintControl.getBlueprints({ $or: [{ name: baseBlueprint }, { name: nextBlueprint }] });
            })            
            .then(blueprints => {
                //check if baseblueprint and nextblueprint are valid
                return new Promise((resolve, reject) => {                    
                    if(blueprints.length==1 && baseBlueprint==nextBlueprint){
                        blueprints.push(blueprints[0]);
                        resolve(blueprints);
                    }                    
                    else if (blueprints.length != 2) {
                        //if the blueprint count is not 2, then there is error
                        let visionErr = CreateVisionError('unable to find 2 blueprint specified', 400);
                        reject(visionErr);
                    }
                    else {
                        //add next into baseblueprint
                        resolve(blueprints);
                    }
                });
            })
            .then(blueprints => {
                return UpdateNextBlueprint_SaveVision(vision_name,blueprints,nextBlueprint,baseBlueprint);
            })
            .then(()=>{
                lockControl.Release(lockName);
            })
            .then(()=>{
                resolve();
            })
            .catch(err => {
                lockControl.Release(lockName)
                    .then(()=>{
                        reject(err);
                    })
                
            });
    });
};
exports.putNextBlueprint = function (req, res) {

    return exports.CreateNewBlueprintSchedule(req.params.vision_name, req.params.blueprint)
        .then(() => {
            //update next blueprint
            return exports.UpdateNextBlueprint(req.params.vision_name, req.params.blueprint, req.params.next);
        })
        .then(() => {
            //return succss indicator
            res.json();
        })
        .catch((err) => {
            res.status(err.status).json(err);

        });
};

exports.RemoveKeyProject = function (visionName, blueprint) {
    //this function is used to remove key Blueprint
    return new Promise((resolve, reject) => {
        visionModel.update({ name: visionName },
            { $pull: { key_projects: { project_blueprint: blueprint._id } } }
            , { multi: true }
            , (err, raw) => {
                if (err) {
                    reject(standardError(err, 500));
                }
                else {
                    resolve(raw);
                }
            });


    });
};
exports.deleteKeyProject = function (req, res) {
    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            //check if blueprint is valid
            return blueprintControl.isBlueprintValid(req.params.projectName);
        })
        .then((blueprint) => {
            //remove key blueprint
            return exports.RemoveKeyProject(req.params.vision_name, blueprint);
        })
        .then(() => {
            //delete successfully
            res.json();
        })
        .catch((err) => {
            res.status(err.status).json(err);
        });
};

exports.RemoveCurrentProject = function (visionName, projectId) {
    return new Promise((resolve, reject) => {
        visionModel.update({ name: visionName },
            { $pull: { current_projects: { _project: projectId } } }
            , { multi: true }
            , (err, raw) => {
                if (err) {
                    reject(standardError(err, 500));
                }
                else {
                    resolve(raw);
                }
            });
    });
};
exports.deleteCurrentProject = function (req, res) {
    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            //check if project id is valid
            return projectControl.isProjectValid(req.params.projectId);
        })
        .then(() => {
            //remove key blueprint
            return exports.RemoveCurrentProject(req.params.vision_name, req.params.projectId);
        })
        .then(() => {
            //delete successfully
            res.json();
        })
        .catch((err) => {
            res.status(err.status).json(err);
        });
};
exports.RemoveProjectSchedule = function (vision, blueprint) {
    return new Promise((resolve, reject) => {
        //does not check the validation of vision and blueprint. Please take care it before this function
        projectBlueprintModel.findOne({name:blueprint})
            .exec((err,blueprint)=>{
                visionModel.update({ name: vision },
                    { $pull: { project_schedule: { project_blueprint: blueprint._id } } }
                    , { multi: true }
                    , (err, raw) => {
                        if (err) {
                            reject(standardError(err, 500));
                        }
                        else {
                            resolve(raw);
                        }
                    });
            });
    });
};
exports.deleteProjectSchedule = function (req, res) {
    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            //check if project id is valid
            return blueprintControl.isBlueprintValid(req.params.blueprint);
        })
        .then(() => {
            //remove project schedule
            return exports.RemoveProjectSchedule(req.params.vision_name, req.params.blueprint);
        })
        .then((raw) => {
            //delete successfully
            res.json(raw);
        })
        .catch((err) => {
            res.status(err.status).json(err);
        });
};

exports.RemoveDormFromSchedule=function(visionName,blueprint,dorm){
    return new Promise((resolve, reject) => {
        
        visionModel.findOne({name:visionName})
            .populate('project_schedule.project_blueprint')
            .populate('project_schedule.machine_demand.dorm')
            .exec((err,vision)=>{
                if(err)
                {
                    reject(standardError(err));
                }
                else if(vision!=null){
                    let blueprintSchedule=null;
                    let machineDemand=null;
                    blueprintSchedule=vision.project_schedule.find(item=>{return item.project_blueprint.name==blueprint;});
                    if(blueprintSchedule==null){
                        reject(standardError(`unable to find blueprint ${blueprint}`, 400));
                        return;
                    }

                    machineDemand=blueprintSchedule.machine_demand.find(item=>{return item.dorm.name==dorm;});
                    if(machineDemand==null){
                        reject(standardError(`unable to find dorm ${dorm}`, 400));
                        return;
                    }

                    blueprintSchedule.machine_demand.id(machineDemand._id).remove();
                    vision.save((err)=>{
                        if(err){
                            if(err.name=='VersionError'){
                                return exports.RemoveDormFromSchedule(visionName,blueprint,dorm)
                                    .then(()=>{
                                        resolve();
                                    })
                                    .catch(err=>{
                                        reject(standardError(err, 500));
                                        return;        
                                    })
                            }
                            else{
                                reject(standardError(err, 500));
                                return;
                            }
                            
                        }
                        else{
                            resolve();
                        }
                    });

                }
            });
        
        

    });    
};

exports.deleteDormInProjectSchedule = function (req, res) {
    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            //check if project id is valid
            return blueprintControl.isBlueprintValid(req.params.blueprint);
        })
        .then(()=>{
            //check if dorm is valid
            return dormControl.IsDormValid(req.params.dorm);
        })
        .then(() => {
            //remove project schedule
            return exports.RemoveDormFromSchedule(req.params.vision_name, req.params.blueprint,req.params.dorm);
        })
        .then((raw) => {
            //delete successfully
            res.json(raw);
        })
        .catch((err) => {
            res.status(err.status).json(err);
        });
};

exports.RemoveNextBlueprintFromSchedule=function(visionName,blueprint,next){
    return new Promise((resolve, reject) => {
        
        visionModel.findOne({name:visionName})
            .populate('project_schedule.project_blueprint')
            .populate('project_schedule.next_project.blueprint')
            .exec((err,vision)=>{
                if(err)
                {
                    reject(standardError(err));
                }
                else if(vision!=null){
                    let blueprintSchedule=null;                    
                    blueprintSchedule=vision.project_schedule.find(item=>{return item.project_blueprint.name==blueprint;});
                    if(blueprintSchedule==null){
                        reject(standardError(`unable to find blueprint ${blueprint}`, 400));
                        return;
                    }

                    blueprintSchedule.next_project=blueprintSchedule.next_project.filter(item=>{return item.blueprint.name!=next;});
                    
                    
                    vision.save((err)=>{
                        if(err){
                            if(err.name=='VersionError'){
                                return exports.RemoveNextBlueprintFromSchedule(visionName,blueprint,next)
                                    .then(()=>{
                                        resolve();
                                        return;
                                    })
                                    .catch(err=>{
                                        reject(standardError(err, 500));
                                        return;
                                    });
                            }
                            else{
                                reject(standardError(err, 500));
                                return;
                            }
                            
                            
                        }
                        else{
                            resolve();
                        }
                    });

                }
            });
        
        

    });  
};
exports.deleteNextBlueprintFromSchedule = function (req, res) {
    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            //check if project schedule blueprint is valid
            return blueprintControl.isBlueprintValid(req.params.blueprint);
        })
        .then(()=>{
            //check if project schedule blueprint is valid
            return blueprintControl.isBlueprintValid(req.params.nextBlueprint);
        })
        .then(() => {
            //remove project schedule
            return exports.RemoveNextBlueprintFromSchedule(req.params.vision_name, req.params.blueprint,req.params.nextBlueprint);
        })
        .then((raw) => {
            //delete successfully
            res.json(raw);
        })
        .catch((err) => {
            res.status(err.status).json(err);
        });
};

exports.putNextTask = function (req, res) {
    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            return projectControl.isProjectValid(req.params.project_id);
        })
        .then(() => {
            return projectControl.GotoNextTaskInProject(req.params.project_id);
        })
        .then(() => {
            res.json();
        })
        .catch((err) => {
            res.status(err.status).json(err);
        });
};
exports.putProjectHost = function (req, res) {
    //validate visio nname
    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            //validate project id
            return projectControl.isProjectValid(req.params.project_id);
        })
        .then(() => {
            //validate host name
            return dormControl.IsDormValid(req.params.hostName);
        })
        .then(() => {
            //update the dorm information in the project
            return projectControl.UpdateHostAndVIDInProject(req.params.project_id, req.params.hostName);
        })
        .then(() => {
            res.json();
        })
        .catch((err) => {
            res.status(err.status).json(err);
        });

};
exports.putProjectStatus = function (req, res) {
    //validate visio nname
    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            //validate project id
            return projectControl.isProjectValid(req.params.project_id);
        })
        .then(() => {
            //update the project status
            return projectControl.UpdateProjectStatus(req.params.project_id, req.params.status);
        })
        .then(() => {
            res.json();
        })
        .catch((err) => {
            res.status(err.status).json(err);
        });
};
