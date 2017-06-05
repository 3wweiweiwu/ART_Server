var Joi=require('joi');

module.exports={
    post:{
        body:{
            name:Joi.string().required(),
            note:Joi.string().required(),                
            status:Joi.string().required()
        }
    },
    getSpecificVision:{
        params:{
            vision_name:Joi.string().required()
        }
    },
    registryGet:{
        params:{
            key:Joi.string().required()
        }
    },
    putKeyProject:{
        prams:{
            vision_name:Joi.string().required(),
            projectBlueprint:Joi.string().required()
        }
    }
}