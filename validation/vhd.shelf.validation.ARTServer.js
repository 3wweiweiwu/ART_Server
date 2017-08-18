var Joi=require('joi');

module.exports={
    getUploadPath:{
        body:{
            created_by:Joi.string().required(),            
            size_byte:Joi.number().required(),
            os:Joi.string().required(),
            installed_products:Joi.array().required()            
        }
    },
    getVHDDownload:{
        params:{
            id:Joi.string().required()
        }
    }
};