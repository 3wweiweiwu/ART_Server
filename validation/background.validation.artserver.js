var Joi=require('joi');

module.exports={
    post:{
        body:{
            name:Joi.string().required(),
            des:Joi.string().required(),
            qualification:Joi.array().required()
        }
    },
    put:{
        body:{
            name:Joi.string().required(),
            des:Joi.string().required(),
            qualification:Joi.array().required()       
        }
    }
    
}