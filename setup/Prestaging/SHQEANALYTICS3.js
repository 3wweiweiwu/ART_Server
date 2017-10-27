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
        mediaDeployment.configure(visionSupport.SHQEANALYTICS3.APM.Deployment.,projectSupport.sampleAPMVHDDetection,projectSupport.sample_HQDEVRACK2_APMVHDDeployment,deployVHD.Constant.apm.HQDEVRACK2.deployment,vhdDetection.Constant.apm,dormSupport.HQDEVRACK2,[{'vid':'mvt2-apm-d4'}])        
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });       
});