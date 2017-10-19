var Joi=require('joi');

module.exports={
    PostRegistry:{
        params:{
            vision:Joi.string().required(),
            project:Joi.string().required(),
            task:Joi.string().required(),
            key:Joi.string().required()
        },
        body:{
            value:Joi.any().required()
        }

    },
    GetRegistry:{
        params:{
            vision:Joi.string().required(),
            project:Joi.string().required(),
            task:Joi.string().required(),
            key:Joi.string().required()
        }
    },
    isRegistryExpired:{
        params:{
            vision:Joi.string().required(),
            project:Joi.string().required(),
            task:Joi.string().required(),
            key:Joi.string().required()
        }
    },
    setRegistryExpired:{
        params:{
            vision:Joi.string().required(),
            project:Joi.string().required(),
            task:Joi.string().required(),
            key:Joi.string().required()
        }
    },    

};