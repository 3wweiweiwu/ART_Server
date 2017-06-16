var Joi=require('joi');

module.exports={
    PostNewBlueprintIntoSchedule:{
        params:{
            vision:Joi.string().required(),
            blueprint:Joi.string().required()
        }
    },
    getVisionScheduleStatus:{
        params:{
            vision:Joi.string().required()
        }
    },
    postVisionScheduleStatus:{
        params:{
            vision:Joi.string().required()
        }
    },
}