let vhdModel=require('../../model/shelf/vhd.shelf.model.ARTServer')
let config=require('../../config')
let StandardError=require('../common/error.controllers.ARTServer')
let fs=require('fs');
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
    let getVHDDownload=function(id){
        return new Promise((resolve,reject)=>{
            vhdModel.findById(id)
                .then(result=>{
                    if(result==null){
                        reject(StandardError(`unable to find id:${id}`,400));
                        return;
                    }
                    else{
                        //check if file is accessable by current system
                        fs.access(result.storage.path,fs.constants.R_OK,err=>{
                            if(err){
                                //have a problem reading the file
                                reject(StandardError(err,500));
                                return;
                            }
                            else{
                                //can read the file, then return the storage part for download
                                resolve(result.storage);
                                return;
                            }
                        });
                    }
                })

        })
    }
    let getVHD=function(){
        return new Promise((resolve,reject)=>{
            vhdModel.find({})
                .then(results=>{
                    //sanitize result, remove storage info
                    results.forEach(item=>{
                        item.storage="";
                    })
                    
                    resolve(results);
                })
                .catch(err=>{
                    reject(StandardError(err,err.status));
                })
        });

    }
    return {
        getUploadPath:getUploadPath,
        getVHDDownload:getVHDDownload,
        getVHD:getVHD
    }
}

module.exports=vhdControl()