var express = require('express');
var router = express.Router();
let util=require('util');
let vhdValidation=require('../validation/vhd.shelf.validation.ARTServer');
var validate = require('express-validation');
let vhdControl=require('../controllers/shelf/vhd.shelf.controllers.ARTServer');
let StandardError=require('../controllers/common/error.controllers.ARTServer');

//multer configuration
let multer=require('multer');
let upload=multer({
    dest:'e:\\temp\\',
    limits:{
        fileSize:9999999999999,        
    },
    fileFilter:vhdValidation.upload
});
function extendTimeout (req, res, next) {
    res.setTimeout(480000, function () { /* Handle timeout */ });
    next();

}
router.get('/shelf/vhd/upload_path',validate(vhdValidation.getUploadPath),function(req,res){
    //it shall return upload path for the task you want to upload
    req.checkBody('installed_products').eachIsNotEmpty('name');
    req.checkBody('installed_products').eachIsNotEmpty('version');
    req.checkBody('installed_products').eachIsNotEmpty('build');

    req.getValidationResult()
        .then(result=>{            
            return new Promise((resolve,reject)=>{
                if(!result.isEmpty()){
                    reject(StandardError(util.inspect(result.array()),404));
                }
                else{
                    resolve();
                }
            });

        })
        .then(()=>{
            //main workflow
            return vhdControl.getUploadPath(req.body.created_by,req.body.size_byte,req.body.os,req.body.installed_products);
        })
        .then((pathObj)=>{
            res.json(pathObj);
        })
        .catch(err=>{
            res.status(err.status).json(err);
        });        

});


router.get('/shelf/vhd',extendTimeout,function(req,res){
    //it shall all available image information
    vhdControl.getVHD()
        .then((result)=>{
            res.json(result);
        })
        .catch(err=>{
            res.status(err.status).json(err);
        });    
    
});
router.get('/shelf/vhd/:id',extendTimeout,function(req,res){
    //it shall all available image information
    let query={};
    if(req.params.id!=undefined){
        query={_id:req.params.id};
    }
        
    vhdControl.getVHD(query)
        .then((result)=>{
            res.json(result);
        })
        .catch(err=>{
            res.status(err.status).json(err);
        });    
    
});
router.get('/shelf/vhd/download/:id',validate(vhdValidation.getVHDDownload),function(req,res){
    //it shall download the image id specified
    vhdControl.getVHDDownload(req.params.id)
        .then((storage)=>{
            res.download(storage.path,storage.originalname);
        })
        .catch(err=>{
            res.status(err.status).json(err);
        });        
});


router.post('/shelf/vhd',extendTimeout,upload.single('file'),function(req,res){    
    //upload vhd to shelf here is a template


    // $otherFieldInfo=@{
    //     created_by="me";
    //     os="10";    
    //     series=''
    //     installed_products=@(
    //         @{name="A+";version="10";build=50},
    //         @{name="HYSYS";version="10";build=55}
    //     );
    //     installed_media=@(
    //         @{name="AES9"},
    //         @{name="AES10"}
    //     )
        
    // }
    
    if(req.fileValidationError) {
        //check if there is any validation error
        res.status(req.fileValidationError.status).json(req.fileValidationError);
        return;
    }
    //no validation error is found, then upload the file
    vhdControl.getUploadPath(req.body.created_by,req.body.os,req.body.installed_products,req.body.installed_media,req.file,req.body.series)
        .then((pathObj)=>{
            res.json(pathObj);
        })
        .catch(err=>{
            res.status(err.status).json(err);
        });

});




module.exports=router;