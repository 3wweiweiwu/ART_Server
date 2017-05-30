var Joi=require('joi');

module.exports={
    body:{
        name:Joi.string().required(),
        note:Joi.string().required(),
        task_script_path:Joi.string().required(),
        setting_type:Joi.string().required()

        
    }
}