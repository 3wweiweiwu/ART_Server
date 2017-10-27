let mediaDeployment=require('../vision/deployment.vision.setup.ARTServer');
//let mediaDetection=require('../task/mediaDetection.task.setup.ARTServer');
let deployVHD=require('../task/vhdDeployment.task.setup.ARTServer');
//let installMedia=require('../task/installMedia.task.setup.ARTServer');
let visionSupport = require('../../controllers/vision/support.vision.controllers.ARTServer');
let projectSupport = require('../../controllers/project/support.project.ARTServer');
let dormSupport = require('../../controllers/organization/support.dorm.controller.ARTServer');
//let vhdCheckin=require('../task/vhdCheckin.task.setup.ARTServer');
let vhdDetection=require('../task/vhdDetection.task.setup.ARTServer');
let assert=require('assert');
describe('Deploy APM VHD',()=>{

    it('shall Add APM prestaging into the project',done=>{
        mediaDeployment.configure(visionSupport.sample_WUWEI1_APMDeployment,projectSupport.sampleAPMVHDDetection,projectSupport.sampleAPMVHDDeployment,deployVHD.Constant.apm.wuwei1.deployment,vhdDetection.Constant.apm,dormSupport.WUWEI1,[{'vid':'mvt2-apm-d3'}])        
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });       
});