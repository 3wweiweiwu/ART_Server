
let deployVHD=require('../task/vhdDeployment.task.setup.ARTServer');

let visionSupport = require('../../controllers/vision/support.vision.controllers.ARTServer');
let projectSupport = require('../../controllers/project/support.project.ARTServer');
let dormSupport = require('../../controllers/organization/support.dorm.controller.ARTServer');

let vhdCheckin=require('../task/vhdCheckin.task.setup.ARTServer');
let mvt=require('../vision/mvt.vision.setup.ARTServer');
let planGenerationSetting=require('../task/planGeneration.task.setup.ARTServer');
let resumeSetting=require('../task/resume.task.setup.ARTServer');
let assert=require('assert');
describe('Add new vision APM Prestaging',()=>{

    it('shall Add APM prestaging into the project',done=>{
        mvt.configure(visionSupport.sampleSCMMVT,projectSupport.sample_MSC_VHDDetection,vhdCheckin.Constant.msc_v11,projectSupport.sample_MSC_SCM_DeploymentForMVT,deployVHD.Constant.msc.mvt,projectSupport.sample_SCM_MVT,planGenerationSetting.Constant.scm,resumeSetting.Constant.SCM,dormSupport.HQQAEBLADE02,[{vid:'mvt2-scm-m1'}])        
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });       
});