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
    it('Deploy APM for QE team',done=>{
        mediaDeployment.configure(visionSupport.sample_APM_Deployment.Analytics_QE_Team_HOUQAEBLADE114,projectSupport.sampleAPMVHDDetection,projectSupport.sample_APM_Deployment.Analytics_QE_HOUQAEBLADE114,deployVHD.Constant.apm.houqaeblade114.Analytics_QE_deployment,vhdDetection.Constant.apm,dormSupport.HOUQAEBLADE114,[{'vid':'mvt2-apm-d2'}])        
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });
    it('Deploy APM for RD team',done=>{
        mediaDeployment.configure(visionSupport.sample_APM_Deployment.Analytics_RD_Team_HOUQAEBLADE114,projectSupport.sampleAPMVHDDetection,projectSupport.sample_APM_Deployment.Analytics_RD_HOUQAEBLADE114,deployVHD.Constant.apm.houqaeblade114.Analytics_RD_deployment,vhdDetection.Constant.apm,dormSupport.HOUQAEBLADE114,[{'vid':'mvt2-apm-d5'}])        
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });
});