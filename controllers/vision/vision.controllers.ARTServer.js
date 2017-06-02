var visionModel=require('../../model/vision/vision.model.ARTServer');
var projectModel=require('../../model/project/project.model.ARTServer');
var projectControl=require('../project/project.controllers.ARTServer')

const UpdateBasicVision=function(req,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        visionModel.findOneAndUpdate({name:req.body.name},{
            name:req.body.name,
            note:req.body.note,
            status:req.body.status
        }
        ,{upsert:true,new:true}
        ,(err,res)=>{
            if(err){
                reject(err);
                cb(err,null);
            }
            else{
                resolve(res);
                cb(null,res);
            }
        })
    });
}

exports.getVision=function(query,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        visionModel
        .find(query)
        .exec((err,res)=>{
            if(err){
                reject(err);
                return cb(err,res);
            }
            else{
                resolve(res);
                return cb(err,res)
            }

        });
    });
}

const isVisionExists=function(visonResult,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        if(visonResult.length==0)
        {
            let errInfo={
                result:'error',
                detail:'invalid argument, fail to find vision name'
            };
            reject(errInfo);
            return cb(errInfo);
        }
        else{
            resolve(visonResult);
            return cb(null,visonResult);
        }
    });
}




exports.get=function(req,res,next,query){
    exports.getVision(query)
    .then((fb)=>{
        res.json(fb);
    })
    .catch((err)=>{
        res.status(500).json(err);
    });
}

exports.create=function(req,res,next){
    UpdateBasicVision(req)
    .then((feedback)=>{
        res.json(feedback);
    })
    .catch((err)=>{
        res.status(500).json(err);
    });
}

exports.putProject=function(req,res,next){
    exports.getVision({name:req.params.vision_name})
    .then(isVisionExists(result))
    .then(result=>{
        
    })
    .catch((err)=>{
        res.status(400).json(err);
    });
}
