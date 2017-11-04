let mediaDeployment=require('../vision/deployment.vision.setup.ARTServer');
//let mediaDetection=require('../task/mediaDetection.task.setup.ARTServer');
let deployVHD=require('../task/vhdDeployment.task.setup.ARTServer');
//let installMedia=require('../task/installMedia.task.setup.ARTServer');
let visionSupport = require('../../controllers/vision/support.vision.controllers.ARTServer');
let projectSupport = require('../../controllers/project/support.project.ARTServer');
let dormSupport = require('../../controllers/organization/support.dorm.controller.ARTServer');
let vhdCheckin=require('../task/vhdCheckin.task.setup.ARTServer');
let assert=require('assert');
describe('Deploy Analytics VHD',()=>{
    it('shall deploy mvt2-apm-d6 in SHQEANALYTICS3',done=>{
        
        mediaDeployment.configure(visionSupport.sample_APM_Deployment.Analytics_QE_Team_SHQEANALYTICS3,projectSupport.sampleAPMVHDDetection,projectSupport.sample_APM_Deployment.Analytics_QE_SHQEANALYTICS3,deployVHD.Constant.apm.SHQEANALYTICS3.Analytics_QE_deployment,vhdCheckin.Constant.analytics_aspenONEV10_0_3,dormSupport.SHQEANALYTICS3,[{'vid':'mvt2-apm-d6'}])
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });  
    it('shall deploy	Mvt2-apm-d2 (HOUQAEBLADE114)',done=>{
        mediaDeployment.configure(visionSupport.sample_APM_Deployment.Analytics_QE_Team_HOUQAEBLADE114,projectSupport.sample_AnalyticsCP.VHD_Detection,projectSupport.sample_APM_Deployment.Analytics_QE_HOUQAEBLADE114,deployVHD.Constant.apm.houqaeblade114.Analytics_QE_deployment,vhdCheckin.Constant.analytics_aspenONEV10_0_3,dormSupport.HOUQAEBLADE114,[{'vid':'mvt2-apm-d2'}])        
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });    
    it('3.	Mvt2-apm-d4 (HQDEVRACK2',done=>{
        mediaDeployment.configure(visionSupport.sample_APM_Deployment.Analytics_QE_Team_HQDEVRACK2,projectSupport.sampleAPMVHDDetection,projectSupport.sample_APM_Deployment.Analytics_RD_HOUQAEBLADE114,deployVHD.Constant.apm.houqaeblade114.Analytics_RD_deployment,vhdCheckin.Constant.analytics_aspenONEV10_0_3,dormSupport.HQDEVRACK2,[{'vid':'mvt2-apm-d4'}])        
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });    
    



});