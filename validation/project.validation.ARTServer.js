var Joi=require('joi');

module.exports={
    blueprintPost:{
        body:{
            name:Joi.string().required(),
            note:Joi.string().required(),
            memory_usage_mb:Joi.number().required(),
            disk_usage_mb:Joi.number().required(),
            tasks:Joi.array().required(),
            next:Joi.array().required()
        }
    }

    
}