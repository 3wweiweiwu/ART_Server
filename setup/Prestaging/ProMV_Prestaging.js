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

    it('shall Add ProMV prestaging into the project',done=>{
        prestaging.configure(visionSupport.sample_Prestaging.ProMV,projectSupport.sample_ProMVCP.Media_Detection,mediaDetection.constant.promv_cp,projectSupport.sample_ProMVCP.Prestaging,deployVHD.Constant.promvCP.prestaging,installMedia.Constant.ProMV_CP,vhdCheckin.Constant.promv_aspenONEV10_0_2,dormSupport.HQQAEBLADE02,'mvt2-pro-01')
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });       
});