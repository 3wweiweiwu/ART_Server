let mediaDetection=require('../task/mediaDetection.task.setup.ARTServer');
let deployVHD=require('../task/vhdDeployment.task.setup.ARTServer');
let installMedia=require('../task/installMedia.task.setup.ARTServer');
let visionSupport = require('../../controllers/vision/support.vision.controllers.ARTServer');
let projectSupport = require('../../controllers/project/support.project.ARTServer');
let dormSupport = require('../../controllers/organization/support.dorm.controller.ARTServer');
let vhdCheckin=require('../task/vhdCheckin.task.setup.ARTServer');
let prestaging=require('../vision/Prestaging.vision.setup.ARTServer');
let assert=require('assert');
describe('Add new vision APM Prestaging',()=>{

    it('shall Add APM prestaging into the project',done=>{
        prestaging.configure(visionSupport.sample_Prestaging.Analytics,projectSupport.sample_AnalyticsCP.Media_Detection,mediaDetection.constant.analytics_cp,projectSupport.sample_AnalyticsCP.Prestaging,deployVHD.Constant.analyticsCP.prestaging,installMedia.Constant.Analytics_CP,vhdCheckin.Constant.analytics_aspenONEV10_0_3,dormSupport.HQQAEBLADE02,'mvt2-ana-01')
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });       
});