
let deployVHD=require('../task/vhdDeployment.task.setup.ARTServer');

let visionSupport = require('../../controllers/vision/support.vision.controllers.ARTServer');
let projectSupport = require('../../controllers/project/support.project.ARTServer');
let dormSupport = require('../../controllers/organization/support.dorm.controller.ARTServer');

let vhdCheckin=require('../task/vhdCheckin.task.setup.ARTServer');
let mvt=require('../vision/mvt.vision.setup.ARTServer');
let planGenerationSetting=require('../task/planGeneration.task.setup.ARTServer');
let resumeSetting=require('../task/resume.task.setup.ARTServer');
let assert=require('assert');
describe('Add new vision A1PE MVT',()=>{

    it('shall Add A1PE MVT into the project',done=>{
        mvt.configure(visionSupport.sample_A1PE_MVT,projectSupport.sample_MSC_VHDDetection,vhdCheckin.Constant.msc_v11,projectSupport.sample_MSC_SCM_DeploymentForMVT,deployVHD.Constant.msc.mvt,projectSupport.sample_A1PE_MVT,planGenerationSetting.Constant.a1pe,resumeSetting.Constant.A1PE,dormSupport.HOUQAEBLADE114,[{vid:'mvt2-a1p-m1'}])        
            .then(()=>{
                done();
            })
            .catch((err)=>{                                
                assert(false,err);
                done();
            });

    });       
});