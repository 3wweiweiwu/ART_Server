process.env.NODE_ENV = 'test';
let async = require('async');
const EventEmitter = require('events');
let app = require('../../app.js');
var assert = require('assert');
var visionModel = require('../../model/vision/vision.model.ARTServer.js');
var taskModel = require('../../model/task/task.model.ARTServer');
var taskImageDeployment  = require('../../model/task/imageDeploy.model.ARTServer');
var projectBlueprintModel=require('../../model/project/projectBlueprint.model.ARTServer')
var projectModel=require('../../model/project/project.model.ARTServer')

var visionControl=require('./vision.controllers.ARTServer')
let projectSupport=require('../../controllers/project/support.project.ARTServer')
let taskSupport=require('../../controllers/task/support.Task.Controllers.ARTServer')
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let visionSupport=require('./support.vision.controllers.ARTServer')
chai.use(chaiHttp);

describe('post /vision',()=>{
    beforeEach((done)=>{
        visionModel.remove({},(err)=>{
            done();
        })
    });
    it('shall throw error when argument is not complete',(done)=>{
        visionSupport.postNewVision(visionSupport.visionAPMChefIncomplete)
        .then((info)=>{
            assert.equal(400,info.status);
            assert(false,'error with post');
            done();
        })
        .catch((err)=>{
            assert.equal(err.resInfo.status,400);
            done();
        })
    })
    it('shall be able to create vision',(done)=>{
        visionSupport.postNewVision(visionSupport.visionAPMChef)
        .then(visionSupport.PostVisionAPMChefoffline)
        .then((info)=>{
            assert.equal(200,info.status);
            visionControl.getVision({})
            .then((info)=>{
                assert.equal(info.length,1);
                assert.equal(info[0].status,visionSupport.visionAPMChefOffline.status);
                done();
            });
            
            
        })
    });
    
});

describe('get /vision',()=>{
    before((done)=>{
        visionModel.remove({},(err)=>{
            done();
        })
    });    
    it('shall return nothing when it is empty',(done)=>{
        chai
        .request(app)
        .get('/api/vision')
        .end((err,res)=>{
            assert.equal(res.body.length,0);
            done();
        });
    });
    it('shall return no task when using /vision/:taskname against empty db',(done)=>{
        chai
        .request(app)
        .get('/api/vision/something')
        .end((err,res)=>{
            assert.equal(res.body.length,0);
            done();
        });        
    });
    it('shall return specific task when using /vision/:taskname against filled db',(done)=>{
        visionSupport.postNewVision(visionSupport.visionAESChef)
        .then(visionSupport.PostVisionAPMChef)
        .then(()=>{
            chai
            .request(app)
            .get('/api/vision/'+visionSupport.visionAPMChef.name)
            .end((err,res)=>{
                assert.equal(res.body.length,1);
                assert.equal(res.body[0].name,visionSupport.visionAPMChef.name);
                done();
            });               
        })
    });

    it('shall return all task when using /vision',(done)=>{
        chai
        .request(app)
        .get('/api/vision/')
        .end((err,res)=>{
            assert.equal(res.body.length,2);
            assert.equal(res.body[1].name,visionSupport.visionAPMChef.name);
            assert.equal(res.body[0].name,visionSupport.visionAESChef.name);
            done();
        });   
    });

    it('shall return registry when using /vision/:vision_name/registry/:key')

});


describe('put /vision',()=>{
    beforeEach((done)=>{
        taskModel.remove({}, (err) => { 
            taskImageDeployment.remove({},(err)=>{
                
                projectBlueprintModel.remove({},(err)=>{
                    projectModel.remove({}).exec(()=>{
                        visionModel.remove({}).exec(()=>{
                            done();
                        })
                        
                    });
                })
                
            })
            
        });          
        
    });
    it('shall return 400 if vision name is invalid when putting against /vision/:vision_name/key_projects/:projectName',(done)=>{
        chai
        .request(app)
        .put('/api/vision/hello/key_projects/disk')
        .end((err,res)=>{
            assert.equal(400,res.status)
            done();
        });

    });
    
    it('shall return 400 if project name is invalid',(done)=>{
        visionSupport.postNewVision(visionSupport.visionAPMChef)
        .then(()=>{
            chai
            .request(app)
            .put('/api/vision/'+visionSupport.visionAPMChef.name+'/key_projects/invalid')
            .end((err,res)=>{
                assert.equal(400,res.status);
                assert.equal(res.body.note,'The project blueprint specified is incorrect')
                done();
            });    
        })
        
    
    });
    it('shall add project blueprint into vision if vision name is valid',(done)=>{
        taskSupport.postTaskAPMNewMediaDetection()
        .then(taskSupport.posttaskAPMInstall)
        .then(projectSupport.postProjectBlueprintAPMPrestaging)
        .then(visionSupport.PostVisionAPMChef)
        .then(()=>{
            chai
            .request(app)
            .put(`/api/vision/${visionSupport.visionAPMChef.name}/key_projects/${projectSupport.projectAPMPrestaging.name}`)
            .end((err,res)=>{
                assert.equal(200,res.status);
                assert.equal(res.body.result,'ok')
                visionModel
                .findOne({name:visionSupport.visionAPMChef.name})
                .then(query=>{
                    assert.equal(query.key_projects.length,1);
                    done();
                });
                
            });            
        });
    });
    it('shall return 400 if vision name is invalid when putting against  /vision/:vision_name/registry',(done)=>{
        visionSupport.PutRegistryMachine1()
        .then((res)=>{
            assert(false,'it shall give 400 error this time')
            done();
        })
        .catch((res)=>{
            assert.equal(res.status,400);
            done();
        })
    });
    it('shall create a new registry or delete new registry',done=>{
        visionSupport.postNewVision(visionSupport.visionAPMChef)
        .then(visionSupport.PutRegistryMachine1)
        .then(visionSupport.PutRegistryMachine2)
        .then(()=>{
            visionModel.findOne({name:visionSupport.visionAPMChef.name})
            .exec((err,vision)=>{
                if(err) assert(false,err);
                assert.equal(vision.registry.length,1);
                assert.equal(vision.registry[0].value,visionSupport.registryMachineName2.value);
                done();
            });
        })
        .catch((err)=>{
            assert(false,err)
            done();
        })
    });
        

})