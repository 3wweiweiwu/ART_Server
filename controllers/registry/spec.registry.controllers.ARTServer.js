process.env.NODE_ENV = 'test';
let async = require('async');
const EventEmitter = require('events');
let app = require('../../app.js');
var assert = require('assert');
var visionModel = require('../../model/vision/vision.model.ARTServer.js');
var taskModel = require('../../model/task/task.model.ARTServer');
var taskImageDeployment = require('../../model/task/imageDeploy.model.ARTServer');
var projectBlueprintModel = require('../../model/project/projectBlueprint.model.ARTServer')
var registryModel = require('../../model/registry/registry.model.ARTServer')

var projectModel = require('../../model/project/project.model.ARTServer')
let projectStatus=require('../project/status.project.controllers.ARTServer');
let projectControl=require('../project/project.controllers.ARTServer')

let dormSupport = require('../organization/support.dorm.controller.ARTServer')
let dormModel = require('../../model/organization/dormModel')

var visionControl = require('../vision/vision.controllers.ARTServer')

var registryControl = require('../../controllers/registry/registry.controllers.ARTServer')
var registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer')
let projectSupport = require('../../controllers/project/support.project.ARTServer')
let taskSupport = require('../../controllers/task/support.Task.Controllers.ARTServer')


let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let visionSupport = require('../vision/support.vision.controllers.ARTServer')
chai.use(chaiHttp);

describe('post /registry/vision/:vision/project/:project/task/:task/key/:key',()=>{
    beforeEach(done=>{
        registryModel.remove()
            .exec(()=>{done()})
    });
    
    it('shall create a new registry against path specified',done=>{
        registrySupport.postRegistry('vision','project','task','key1','value1')
            .then(()=>{
                registryModel.findOne({vision:'vision',project:'project',task:'task',key:'key1',value:'value1'})
                    .exec((err,registry)=>{
                        assert.notEqual(registry,null);
                        done();
                    })
            })
            .catch(err=>{
                assert(false,err);
            })
    })
    it('shall override existing registry against path specified',done=>{
        registrySupport.postRegistry('vision','project','task','key1','value1')
            .then(()=>{
                //override existing value
                return registrySupport.postRegistry('vision','project','task','key1','value2');
            })        
            .then(()=>{
                registryModel.find({vision:'vision',project:'project',task:'task',key:'key1'})
                    .exec((err,registryList)=>{
                        assert.equal(registryList.length,1);
                        assert.equal(registryList[0].value,'value2');
                        done();
                    })
            })
            .catch(err=>{
                assert(false,err);
            })
    })
})
describe('get /registry/vision/:vision/project/:project/task/:task/key/:key',()=>{
    beforeEach(done=>{
        registryModel.remove()
            .exec(()=>{done()})
    });    
    it('shall return the registry specified',done=>{
        //post registry
        registrySupport.postRegistry('vision','project','task','key1','value1')
            .then(()=>{
                //override existing value
                return registrySupport.postRegistry('vision','project','task','key2','value2');
            })          
            .then(()=>{
                //get registry
                return registrySupport.getRegistry('vision','project','task','key1');
            })
            .then(result=>{
                assert(result.body.result,'value1');
                done();
            })
            .catch(err=>{
                assert(false,err);
            })
        
    })
    it('shall return 400 error when path specified does not exists',done=>{
        registrySupport.getRegistry('vision','project','task','key1')
            .then(()=>{
                assert(false,'it shall not return pass');
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                done();
            })
    })
})