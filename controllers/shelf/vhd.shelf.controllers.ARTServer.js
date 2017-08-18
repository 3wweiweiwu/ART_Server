let vhdModel=require('../../model/shelf/vhd.shelf.model.ARTServer')
let config=require('../../config')
let path=require('path');
let StandardError=require('../common/error.controllers.ARTServer')
let vhdControl=function(){

    let getUploadPath=function(createdBy,os,productList,mediaList,storageInfo){
        return new Promise((resolve,reject)=>{
            storageInfo.username=config.shelf.user_name;
            storageInfo.password=config.shelf.password;
            let vhdDoc=new vhdModel({
                created:{
                    By:createdBy,
                    at:Date.now(),
                    intro:''
                },
                content:{                    
                    os:os,
                    installed_products:productList,
                    installed_media:mediaList
                },
                storage:storageInfo
            });            
            vhdDoc.save(err=>{
                if(err){
                    reject(StandardError(err,500));
                    return;
                }
                else{                    
                    resolve();
                }
            })
        })
    }
    let getVHDDownload=function(){

    }
    let getVHD=function(){

    }
    return {
        getUploadPath:getUploadPath,
        getVHDDownload:getVHDDownload,
        getVHD:getVHD
    }
}

module.exports=vhdControl()