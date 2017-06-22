var visionModel = require('../../model/vision/vision.model.ARTServer');
var projectModel = require('../../model/project/project.model.ARTServer');
var projectControl = require('../project/project.controllers.ARTServer')
let projectBlueprintModel = require('../../model/project/projectBlueprint.model.ARTServer')
let blueprintControl = require('../project/projectBlueprint.controllers.ARTServer')
let dormModel = require('../../model/organization/dormModel')
let dormControl = require('../../controllers/organization/dormControl')
let standardError = require('../common/error.controllers.ARTServer')
const UpdateBasicVision = function (req, cb = () => { }) {
    return new Promise((resolve, reject) => {
        visionModel.findOneAndUpdate({ name: req.body.name }, {
            name: req.body.name,
            note: req.body.note,
            status: req.body.status
        }
            , { upsert: true, new: true }
            , (err, res) => {
                if (err) {
                    reject(err);
                    cb(err, null);
                }
                else {
                    resolve(res);
                    cb(null, res);
                }
            })
    });
}
const CreateVisionError = standardError;
const CreateBasicVision = function (req, cb = () => { }) {
    return new Promise((resolve, reject) => {
        visionModel
            .remove({ name: req.body.name })
            .exec((err) => {
                vision = new visionModel({
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
                        resolve();
                        return cb(null);
                    }
                });
            });
    });
}


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
            .exec((err, res) => {
                if (err) {
                    reject(err);
                    return cb(err, res);
                }
                else {
                    resolve(res);
                    return cb(err, res)
                }

            });
    });
}

const isVisionExists = function (visonResult, cb = () => { }) {
    return new Promise((resolve, reject) => {
        if (visonResult.length == 0) {
            let errInfo = {
                result: 'error',
                detail: 'invalid argument, fail to find vision name'
            };
            reject(errInfo);
            return cb(errInfo);
        }
        else {
            resolve(visonResult);
            return cb(null, visonResult);
        }
    });
}




exports.get = function (req, res, next, query) {
    exports.getVision(query)
        .then((fb) => {
            res.json(fb);
        })
        .catch((err) => {
            res.status(500).json(err);
        });
}

exports.create = function (req, res, next) {
    CreateBasicVision(req)
        .then((feedback) => {
            res.json(feedback);
        })
        .catch((err) => {
            res.status(500).json(err);
        });
}

const IsBlueprintValid=(visionList,blueprint)=>{
    return (new Promise((resolve,reject)=>{
            if(visionList.length!=1){
                reject(standardError('unable to find vision specified'),400);
                return;
            }
            //get the first vision
            vision=visionList[0];

            let projectSchedule=vision.project_schedule.find(item=>{return item.project_blueprint.name==blueprint})                    
            //if we cannot find the projectSchedule specified, then quit
            if(projectSchedule==null){
                reject(standardError(`unable to find blueprint specified ${blueprint} in the vision`,400));
                return;
            }
            else{
                resolve(vision);
            }
        }));
}
exports.IsBlueprintInProjectScheduleValid=function(vision,blueprint){
    return new Promise((resolve,reject)=>{
        exports.getVision({name:vision})
            .then(visionList=>{
                return IsBlueprintValid(visionList,blueprint)
            })
            .then(vision=>{
                resolve(vision);
            })
            .catch(err=>{
                reject(err);
            });
    });
}
const AddProjectIntoVision=(visionName,projectId)=>{
    return new Promise((resolve,reject)=>{

        //add projectId into vision
        visionModel.update(
            { name: visionName },
            { $addToSet: { current_projects: { _project: projectId } } },
            (err, raw) => {
                if (err) {
                    reject(standardError(err, 500));
                }
                else {
                    resolve({ projectId: projectId });
                }
            }
        );

    })
}


exports.CreateNewProjectAndAddToVision = function (visionName, blueprint) {
    return new Promise((resolve, reject) => {
        projectControl.CreateNewProject(blueprint)
            .then(projectId => {
                return AddProjectIntoVision(visionName,projectId)
            })
            .then(projectId=>{
                resolve(projectId);
            })
            .catch(err=>{
                reject(err);
            })
    });
}

exports.postNewProject = function (req, res, next) {

    checkVisionNameValid(req.params.vision)
        .then(() => {
            //check if blueprint is valid
            return blueprintControl.isBlueprintValid(req.params.blueprint);
        })
        .then((blueprintDoc) => {
            //remove key blueprint
            return exports.CreateNewProjectAndAddToVision(req.params.vision, req.params.blueprint);
        })
        .then((raw) => {
            
            res.json(raw);
        })
        .catch((err) => {
            res.status(err.status).json(err);
        });

}


exports.putProject = function (req, res, next) {
    exports.getVision({ name: req.params.vision_name })
        .then(isVisionExists(result))
        .then(result => {

        })
        .catch((err) => {
            res.status(400).json(err);
        });
}
const checkVisionNameValid = function (name, cb = () => { }) {
    return new Promise((resolve, reject) => {
        query = {
            name: name,
        }
        exports.getVision(query)
            .then((vision) => {
                if (vision.length == 0) {
                    //if no vision found, then return with error
                    err = {
                        result: 'error',
                        status: 400,
                        note: 'unable to find vision specified'
                    }
                    reject(err);
                    return cb(err);
                }
                else if (vision.length != 1) {
                    //if more than 1 vision found, then flag with error
                    err = {
                        result: 'error',
                        status: 500,
                        note: 'there are more than one vision with the same name'
                    }
                    reject(err);
                    return cb(err);
                }
                else {
                    resolve(vision);
                    return cb(null, query);
                }
            })

    });
}

const initializeProject = function (vision, cb = () => { }) {
    return new Promise((resolve, reject) => {

    });
}
exports.PutKeyProject = function (req, res, next) {

    checkVisionNameValid(req.params.vision_name)
        .then((vision) => {
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
                        })
                    }
                    else {
                        //if blueprint is found, then link blueprint with project
                        vision[0].key_projects.push({ project_blueprint: blueprint._id });
                        vision[0].save((err) => {
                            if (err) {
                                //if error is found, then return error
                                rs.status(500).json({
                                    result: 'error',
                                    note: err
                                })
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

}

exports.PutRegistry = function (req, res, next) {
    checkVisionNameValid(req.params.vision_name)
        .then(query => {
            let queryResult = query[0];
            queryResult.registry = queryResult.registry.filter((item) => { return item.key != req.body.key });
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
            })
        })
        .catch(err => {
            res.status(err.status || 500).json(err);
        });
}

exports.GetRegistry = function (req, res, next) {
    visionModel.findOne({ name: req.params.vision_name, 'registry.key': req.params.key })
        .exec((err, vision) => {
            if (err) {
                res.status(500).json(err);
            }
            else if (vision != null) {
                //if there is such a vision
                res.json(vision.registry.filter(value => { return value.key == req.params.key })[0]);
            }
            else {
                res.status(400).json({ value: null });
            }
        })
}


exports.CreateNewBlueprintSchedule = function (visions, blueprintName, cb = () => { }) {
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
                    reject(result)
                    return cb(result);
                }

                //find out schedule for specific blueprint
                vision = visions[0];
                let result = vision.project_schedule.find(schedule => { return schedule.name === blueprintName });
                if (result == null) {
                    schedule = {
                        project_blueprint: blueprint._id,
                        server_ask: 1,
                        machine_demand: [],
                        next_project: []
                    }
                    vision.project_schedule.push(schedule);
                    vision.save((err) => {
                        if (err) {
                            let result = {
                                status: 500,
                                err: err
                            };
                            reject(result);
                            return cb(result)

                        }
                        else {
                            resolve();
                            return cb(null)
                        }

                    })
                }
                else {
                    //if there is existing project schedule, then simply return
                    resolve();
                    return cb(null)
                }

            });



    });
}
exports.PutBlueprint = function (req, res, next) {

    checkVisionNameValid(req.params.vision_name)
        .then((vision) => {
            return exports.CreateNewBlueprintSchedule(vision, req.params.blueprint);
        })
        .then(() => {
            res.json();
        })
        .catch(err => { res.status(err.status).json(err); });
}
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
                else if (vision == null) {

                }
                else {
                    //update server ask for specific schedule
                    let scheduleIndex = vision.project_schedule.findIndex(schedule => { return schedule.project_blueprint.name === blueprint });
                    vision.project_schedule[scheduleIndex].server_ask = serverAsk;
                    vision.save((err) => {
                        if (err) {

                            reject(CreateVisionError(err, 500));
                            return cb(CreateVisionError(err, 500));
                        }
                        else {
                            resolve();
                            return cb();
                        }
                    });

                }
            });

    });

}
exports.putBlueprintServerAsk = function (req, res, next) {
    //vision check
    checkVisionNameValid(req.params.vision_name)
        .then((vision) => {
            //initialize schedule
            return exports.CreateNewBlueprintSchedule(vision, req.params.blueprint);
        })
        .then(() => {
            //update server ask
            return exports.UpdateServerAsk(req.params.vision_name, req.params.blueprint, req.params.ask)
        })
        .then(() => {
            //return succss indicator
            res.json();
        })
        .catch(err => { res.status(err.status).json(err); });
}

exports.UpdateBlueprintMachineInstance = function (vision, blueprint, machine, ask) {
    return new Promise((resolve, reject) => {
        dormControl.GetDorm(machine)
            .then((machineInfo) => {
                //validate machine
                if (machineInfo == null) {
                    //if no machine found, then throw no-machine error
                    result = CreateVisionError('cannot find machine specified', 400);
                    reject(result);
                    return;
                }

                //machine found, then try to find blueprint
                visionModel.findOne({
                    name: vision
                })
                    .populate({ path: 'current_projects' })
                    .populate({ path: 'project_schedule.project_blueprint' })
                    .populate({ path: 'project_schedule.machine_demand.dorm' })
                    .exec((err, vision) => {
                        if (err) {
                            //defend query error
                            reject(CreateVisionError(err, 500));
                            return cb(CreateVisionError(err, 500));
                        }
                        else {
                            //find specific blueprint index
                            let scheduleIndex = vision.project_schedule.findIndex(schedule => { return schedule.project_blueprint.name === blueprint });
                            //find specific machine index
                            let machineIndex = vision.project_schedule[scheduleIndex].machine_demand.findIndex(machineInstance => { return machineInstance.dorm.name === machine });
                            if (machineIndex == -1) {
                                //if it is a new machine, then we push the machine into array
                                let machine_demand = {
                                    dorm: machineInfo._id,
                                    instance: ask
                                }
                                vision.project_schedule[scheduleIndex].machine_demand.push(machine_demand);
                            }
                            else {
                                //if machine found, then update the machine info
                                vision.project_schedule[scheduleIndex].machine_demand[machineIndex].instance = ask;
                            }

                            vision.save((err) => {
                                if (err) {
                                    //server error is detected in save
                                    reject(CreateVisionError(err, 500));
                                }
                                else {
                                    resolve()
                                }
                            })

                        }
                    });

            });




    });
}
exports.putBlueprintMachineInstance = function (req, res, next) {
    //vision check
    checkVisionNameValid(req.params.vision_name)
        .then((vision) => {
            //initialize schedule
            return exports.CreateNewBlueprintSchedule(vision, req.params.blueprint);
        })
        .then(() => {
            //update machine instance
            return exports.UpdateBlueprintMachineInstance(req.params.vision_name, req.params.blueprint, req.params.machine, req.params.ask)
        })
        .then(() => {
            //return succss indicator
            res.json();
        })
        .catch(err => { res.status(err.status).json(err); });
}
exports.UpdateNextBlueprint = function (vision_name, baseBlueprint, nextBlueprint, cb = () => { }) {
    return new Promise((resolve, reject) => {
        blueprintControl
            .getBlueprints({ $or: [{ name: baseBlueprint }, { name: nextBlueprint }] })
            .then(blueprints => {
                //check if baseblueprint and nextblueprint are valid
                return new Promise((resolve, reject) => {
                    if (blueprints.length != 2) {
                        //if the blueprint count is not 2, then there is error
                        let visionErr = CreateVisionError('unable to find 2 blueprint specified', 400)
                        reject(visionErr);
                    }
                    else {
                        //add next into baseblueprint
                        resolve(blueprints);
                    }
                })
            })
            .then(blueprints => {
                //get vision and update base blueprint specified
                visionModel.findOne({ name: vision_name })
                    .populate('project_schedule.project_blueprint')
                    .exec((err, vision) => {
                        if (err) {
                            reject(CreateVisionError(500, err));
                        }
                        else {
                            let nextBlueprintDoc = blueprints.find(item => { return item.name == nextBlueprint });
                            let scheduleIndex = vision.project_schedule.findIndex(item => { return item.project_blueprint.name == baseBlueprint });
                            vision.project_schedule[scheduleIndex].next_project.push({ blueprint: nextBlueprintDoc._id });
                            vision.save((err) => {
                                if (err) {
                                    reject(CreateVisionError(500, err));
                                }
                                else {
                                    resolve();
                                }
                            })

                        }

                    })

            })
            .catch(err => {
                reject(err);
            })
    });
}
exports.putNextBlueprint = function (req, res, next) {
    checkVisionNameValid(req.params.vision_name)
        .then((vision) => {
            //initialize schedule
            return exports.CreateNewBlueprintSchedule(vision, req.params.blueprint);
        })
        .then(() => {
            //update next blueprint
            return exports.UpdateNextBlueprint(req.params.vision_name, req.params.blueprint, req.params.next)
        })
        .then(() => {
            //return succss indicator
            res.json();
        })
        .catch((err) => {
            res.status(err.status).json(err);

        });
}

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
            })


    });
}
exports.deleteKeyProject = function (req, res, next) {
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
}

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
            })
    });
}
exports.deleteCurrentProject = function (req, res, next) {
    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            //check if project id is valid
            return projectControl.isProjectValid(req.params.projectId)
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
}
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
                    })
            })
    });
}
exports.deleteProjectSchedule = function (req, res, next) {
    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            //check if project id is valid
            return blueprintControl.isBlueprintValid(req.params.blueprint)
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
}

exports.RemoveDormFromSchedule=function(vision,blueprint,dorm){
    return new Promise((resolve, reject) => {
        
        visionModel.findOne({name:vision})
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
                    blueprintSchedule=vision.project_schedule.find(item=>{return item.project_blueprint.name==blueprint});
                    if(blueprintSchedule==null){
                        reject(standardError(`unable to find blueprint ${blueprint}`, 400));
                        return;
                    }

                    machineDemand=blueprintSchedule.machine_demand.find(item=>{return item.dorm.name==dorm});
                    if(machineDemand==null){
                        reject(standardError(`unable to find dorm ${dorm}`, 400));
                        return;
                    }

                    blueprintSchedule.machine_demand.id(machineDemand._id).remove();
                    vision.save((err)=>{
                        if(err){
                            reject(standardError(err, 500));
                        }
                        else{
                            resolve();
                        }
                    })

                }
            });
        
        

    });    
}

exports.deleteDormInProjectSchedule = function (req, res, next) {
    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            //check if project id is valid
            return blueprintControl.isBlueprintValid(req.params.blueprint)
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
}

exports.RemoveNextBlueprintFromSchedule=function(vision,blueprint,next){
    return new Promise((resolve, reject) => {
        
        visionModel.findOne({name:vision})
            .populate('project_schedule.project_blueprint')
            .populate('project_schedule.next_project.blueprint')
            .exec((err,vision)=>{
                if(err)
                {
                    reject(standardError(err));
                }
                else if(vision!=null){
                    let blueprintSchedule=null;                    
                    blueprintSchedule=vision.project_schedule.find(item=>{return item.project_blueprint.name==blueprint});
                    if(blueprintSchedule==null){
                        reject(standardError(`unable to find blueprint ${blueprint}`, 400));
                        return;
                    }

                    blueprintSchedule.next_project=blueprintSchedule.next_project.filter(item=>{return item.blueprint.name!=next});
                    
                    
                    vision.save((err)=>{
                        if(err){
                            reject(standardError(err, 500));
                        }
                        else{
                            resolve();
                        }
                    })

                }
            });
        
        

    });  
}
exports.deleteNextBlueprintFromSchedule = function (req, res, next) {
    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            //check if project schedule blueprint is valid
            return blueprintControl.isBlueprintValid(req.params.blueprint)
        })
        .then(()=>{
            //check if project schedule blueprint is valid
            return blueprintControl.isBlueprintValid(req.params.nextBlueprint)
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
}

exports.putNextTask = function (req, res, next) {
    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            return projectControl.isProjectValid(req.params.project_id)
        })
        .then(() => {
            return projectControl.GotoNextTaskInProject(req.params.project_id)
        })
        .then(() => {
            res.json();
        })
        .catch((err) => {
            res.status(err.status).json(err);
        });
}
exports.putProjectHost = function (req, res, next) {
    //validate visio nname
    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            //validate project id
            return projectControl.isProjectValid(req.params.project_id)
        })
        .then(() => {
            //validate host name
            return dormControl.IsDormValid(req.params.hostName)
        })
        .then(() => {
            //update the dorm information in the project
            return projectControl.UpdateHostInProject(req.params.project_id, req.params.hostName)
        })
        .then(() => {
            res.json();
        })
        .catch((err) => {
            res.status(err.status).json(err);
        });

}
exports.putProjectStatus = function (req, res, next) {
    //validate visio nname
    checkVisionNameValid(req.params.vision_name)
        .then(() => {
            //validate project id
            return projectControl.isProjectValid(req.params.project_id)
        })
        .then(() => {
            //update the project status
            return projectControl.UpdateProjectStatus(req.params.project_id, req.params.status)
        })
        .then(() => {
            res.json();
        })
        .catch((err) => {
            res.status(err.status).json(err);
        });
}
