var Joi=require('joi');
module.exports={
    PutDiskInitializationSignal:{
        params:{
            dormName:Joi.string().required()
        },
        body:{
            diskProfile:Joi.array().required()
        }
    },
    DeleteDorm:{
        params:{
            dormName:Joi.string().required()
        }
    },
    PutVMToDorm:{
        params:{
            dormName:Joi.string().required(),
            size_mb:Joi.number().required(),
            driveLetter:Joi.required()
        }
    },
    RefreshDorm:{
        params:{
            dormName:Joi.string().required()
        }
    }
}