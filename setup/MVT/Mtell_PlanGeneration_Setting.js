
let deployVHD=require('../task/vhdDeployment.task.setup.ARTServer');

let visionSupport = require('../../controllers/vision/support.vision.controllers.ARTServer');
let projectSupport = require('../../controllers/project/support.project.ARTServer');
let dormSupport = require('../../controllers/organization/support.dorm.controller.ARTServer');
let vhdDetection=require('../task/vhdDetection.task.setup.ARTServer');

let mvt=require('../vision/mvt.vision.setup.ARTServer');
let planGenerationSetting=require('../task/planGeneration.task.setup.ARTServer');
let resumeSetting=require('../task/resume.task.setup.ARTServer');
let assert=require('assert');
describe('Add new vision APM Prestaging',()=>{

    it('shall Add APM prestaging into the project',done=>{
        mvt.configure(visionSupport.sampleMtellMVT,projectSupport.sampleMTELLVHDDetection,vhdDetection.Constant.mtellDetection,projectSupport.sampleMtellVHDDeployment,deployVHD.Constant.mtellMVTDeployment,projectSupport.sampleMtellMVT,planGenerationSetting.Constant.mtellSetting,resumeSetting.Constant.mtellSetting,dormSupport.qe_mtell_01,[{vid:'mvt2-mtell-m1'}])        
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });       
});