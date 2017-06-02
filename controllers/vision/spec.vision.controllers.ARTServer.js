process.env.NODE_ENV = 'test';
let async = require('async');
const EventEmitter = require('events');
let app = require('../../app.js');
var assert = require('assert');
var visionModel = require('../../model/vision/vision.model.ARTServer.js');
var visionControl=require('./vision.controllers.ARTServer')
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
chai.use(chaiHttp);

const postNewVision=function(visionObj,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai
        .request(app)
        .post('/api/vision')
        .send(visionObj)
        .end((err,res)=>{
            if(err){
                reject({
                    errorInfo:err,
                    resInfo:res
                });
                return cb(err);
            }
            else{
                resolve(res);
                return cb(null,res);
            }
        });
    });
}
const visionAPMChef={
    name:'APM_Chef',
    note:'Prepare daily APM image',
    status:'online'
}
const visionAESChef={
    name:'AES_Chef',
    note:'Prepare daily AES image',
    status:'online'
}
const visionAPMChefOffline={
    name:'APM_Chef',
    note:'Prepare daily APM image',
    status:'offline'
}
const visionAPMChefIncomplete={
    name:'APM_Chef',    
    status:'offline'
}
describe('post /vision',()=>{
    beforeEach((done)=>{
        visionModel.remove({},(err)=>{
            done();
        })
    });
    it('shall throw error when argument is not complete',(done)=>{
        postNewVision(visionAPMChefIncomplete)
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
        postNewVision(visionAPMChef)
        .then(postNewVision(visionAPMChefOffline))
        .then((info)=>{
            assert.equal(200,info.status);
            visionControl.getVision({})
            .then((info)=>{
                assert.equal(info.length,1);
                assert.equal(info[0].status,visionAPMChefOffline.status);
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
        postNewVision(visionAESChef)
        .then(postNewVision(visionAPMChef))
        .then(()=>{
            chai
            .request(app)
            .get('/api/vision/'+visionAPMChef.name)
            .end((err,res)=>{
                assert.equal(res.body.length,1);
                assert.equal(res.body[0].name,visionAPMChef.name);
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
            assert.equal(res.body[1].name,visionAPMChef.name);
            assert.equal(res.body[0].name,visionAESChef.name);
            done();
        });   
    });

    it('shall return registry when using /vision/:vision_name/registry/:key')

});


describe('put /vision',()=>{
    it('shall return 400 if vision name is invalid when putting against /vision/:vision_name/key_projects/:projectName')
    
    it('shall return 400 if project name is invalid')
    it('shall add project into vision if vision name is valid')
    it('shall return 400 if vision name is invalid when putting against  /vision/:vision_name/registry')
    it('shall create a new registry or delete new registry')
})