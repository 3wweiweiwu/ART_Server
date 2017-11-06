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
    it('2.	mvt2-pro-d3 (shqeanalytics3 ) - ProMV',done=>{        
        mediaDeployment.configure(visionSupport.sample_APM_Deployment.ProMV.QE.Mvt2_pro_d3,projectSupport.sample_ProMVCP.VHD_Detection,projectSupport.sample_APM_Deployment.ProMV.QE.Mvt2_pro_d3,deployVHD.Constant.promvCP.deployment.QE_Standard,vhdCheckin.Constant.promv_aspenONEV10_0_2,dormSupport.SHQEANALYTICS3,[{'vid':'mvt2-pro-d3'}])
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });  
    it('2.	Mvt2-apm-d5 (HOUQAEBLADE114) - ProMV',done=>{        
        mediaDeployment.configure(visionSupport.sample_APM_Deployment.ProMV.QE.Mvt2_apm_d5,projectSupport.sample_ProMVCP.VHD_Detection,projectSupport.sample_APM_Deployment.ProMV.QE.Mvt2_apm_d5,deployVHD.Constant.promvCP.deployment.QE_Standard,vhdCheckin.Constant.promv_aspenONEV10_0_2,dormSupport.HOUQAEBLADE114,[{'vid':'mvt2-apm-d5'}])
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });
    it('2.	mvt2-pro-d1 (HQDEVRACK2) - ProMV',done=>{        
        mediaDeployment.configure(visionSupport.sample_APM_Deployment.ProMV.QE.Mvt2_pro_d1,projectSupport.sample_ProMVCP.VHD_Detection,projectSupport.sample_APM_Deployment.ProMV.QE.Mvt2_pro_d1,deployVHD.Constant.promvCP.deployment.QE_Standard,vhdCheckin.Constant.promv_aspenONEV10_0_2,dormSupport.HQDEVRACK2,[{'vid':'mvt2-pro-d1'}])
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });
    it('2.	mvt2-pro-d2 (HQDEVRACK2) - ProMV',done=>{        
        mediaDeployment.configure(visionSupport.sample_APM_Deployment.ProMV.QE.Mvt2_pro_d2,projectSupport.sample_ProMVCP.VHD_Detection,projectSupport.sample_APM_Deployment.ProMV.QE.Mvt2_pro_d2,deployVHD.Constant.promvCP.deployment.QE_Standard,vhdCheckin.Constant.promv_aspenONEV10_0_2,dormSupport.HQDEVRACK2,[{'vid':'mvt2-pro-d2'}])
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });   


});