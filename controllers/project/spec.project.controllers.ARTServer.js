process.env.NODE_ENV = 'test';
let async = require('async');
const EventEmitter = require('events');
let app = require('../../app.js');
var assert = require('assert');
var projectBlueprintModel=require('../../model/project/projectBlueprint.model.ARTServer');
var projectModel = require('../../model/project/project.model.ARTServer');
var projectControl=require('./project.controllers.ARTServer')
var projectSupport=require('./support.project.ARTServer')
var projectBlueprintModel=require('../../model/project/projectBlueprint.model.ARTServer');
var taskSupport=require('../task/support.Task.Controllers.ARTServer')
var taskImageDeployment = require('../../model/task/imageDeploy.model.ARTServer');
var taskModel = require('../../model/task/task.model.ARTServer.js');
let projectStatus=require('./status.project.controllers.ARTServer')

let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
chai.use(chaiHttp);

describe('create new project',()=>{
    beforeEach((done)=>{
        taskModel.remove({}, (err) => { 
            taskImageDeployment.remove({},(err)=>{
                projectBlueprintModel.remove({},(err)=>{
                    projectModel.remove({}).exec(()=>{
                        done();
                    });
                })
                
            })
            
        });          
        
    });
    it('shall return error when blueprint is invalid',(done)=>{
        projectControl.CreateNewProject('invalid_blueprint')
        .then(()=>{
            assert(false,'it shall return error');
            done();
        })
        .catch((err)=>{
            if(err.result!='error'){assert(false,'the error information is incorrect')}
            done();
        });
    });
    it('shall create new project when blueprint is valid',(done)=>{

        const CreateNewProject=()=>{
            return projectControl.CreateNewProject(projectSupport.projectAPMPrestaging.name);
        }
        //real workflow procedure
        taskSupport.postTaskAPMNewMediaDetection()
        .then(taskSupport.posttaskAPMInstall)
        .then(projectSupport.postProjectBlueprintAPMPrestaging)
        .then(CreateNewProject)
        .then((id)=>{
            assert.notEqual(id,null);
            
            //validate the creation of the project
            
            projectControl
            .GetProjectById(id)
            .then((project)=>{
                assert.equal(projectStatus.waitingForScheduling.id,project.status);
                done();
            })
            .catch((err)=>{
                assert(false,'unable to get project back');
                done();
            });            
        })
        .catch((err)=>{
            assert(false,err);            
            done();
        });



        
    });
})

