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
        prestaging.configure(visionSupport.sample_AES_Prestaging,projectSupport.sample_AES_MediaDetection,mediaDetection.constant.aes,projectSupport.sample_AES_Prestaging,deployVHD.Constant.aes.prestaging,installMedia.Constant.aes,vhdCheckin.Constant.aes_V11,dormSupport.HQDEVBLADE28,'mvt2-aes-01')
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });       
});