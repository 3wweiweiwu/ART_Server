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
        prestaging.configure(visionSupport.sampleMtell,projectSupport.sampleBP_MtellMediaDetection,mediaDetection.constant.mtellMediaDetection,projectSupport.sampleMtellDeployment,deployVHD.Constant.mtellPrestagingDeployment,installMedia.Constant.mtellMediaInstallation,vhdCheckin.Constant.mtell,dormSupport.qe_mtell_01,'mvt2-mtell-2')        
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });       
});