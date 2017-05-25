var Joi=require('joi');

module.exports={
    post:{
        body:{
            name:Joi.string().required(),
            requirement:Joi.array().required()        
        }
    },
    put:{
        body:{
            name:Joi.string().required(),
            requirement:Joi.array().required()        
        }
    }
    
}