let vhdModel=require('../../model/shelf/vhd.shelf.model.ARTServer');
let shelfManagerModel=require('../../model/shelf/manager.shelf.model.ARTServer');
let config=require('../../config');
let StandardError=require('../common/error.controllers.ARTServer');
let fs=require('fs');
let visionControl=require('../vision/vision.controllers.ARTServer');
let lockControl=require('../common/lock.common.controllers.ARTServer');
let vhdControl=function(){

    let getUploadPath=function(createdBy,os,productList,mediaList,storageInfo,series){
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
                    series:series,
                    installed_products:productList,
                    installed_media:mediaList
                },
                storage:storageInfo
            });            
            vhdDoc.save(err=>{
                //check if newly saved item is there

                if(err){
                    reject(StandardError(err,500));
                    return;
                }
                else{                    
                    resolve();
                }
            });
        });
    };
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
                });

        });
    };
    let getVHD=function(query){
        return new Promise((resolve,reject)=>{
            vhdModel.find(query)
                .then(results=>{
                    //sanitize result, remove all storage info except for size
                    results.forEach(item=>{
                        let tempOriginalName=item.storage.originalname;
                        item.storage='';
                        item.storage.originalname=tempOriginalName;
                    });
                    
                    resolve(results);
                })
                .catch(err=>{
                    reject(StandardError(err,err.status));
                });
        });

    };
    let postSeries=function(seriesName){
        //check if there is any existing series, if so, then return error
        //otherwise, create a new vision
        return new Promise((resolve,reject)=>{
            
            getSeriesInfo(seriesName)
                .then(seriesList=>{
                    //find existing series
                    
                    if(seriesList.length>0){
                        reject(StandardError(`There is existing series name: ${seriesName}, please use other name`,400));
                        return;
                    }
                    
                    return createNewSeries(seriesName);
                })
                .then((seriesId)=>{
                    resolve(seriesId);
                })
                .catch(err=>{
                    reject(StandardError(err,500));
                });
        });
        
    };

    let createNewSeries=function(seriesName){
        return new Promise((resolve,reject)=>{
            let newShelfManager=new shelfManagerModel({
                series:seriesName,
                max_inventory:3,
                inventory:[],
                subscribers:[]
            });
            newShelfManager.save(err=>{
                if(err){
                    reject(StandardError(err,500));
                }
                else{
                    resolve(newShelfManager._id);
                }
            });            
        });
    };
    
    let getSeriesInfo=function(seriesName=null){
        
        let query={};
        if(seriesName!=null){
            query={series:seriesName};
        }
        
        return new Promise((resolve,reject)=>{
            shelfManagerModel.find(query)
                .then(seriesList=>{
                    resolve(seriesList);
                })            
                .catch(err=>{
                    reject(StandardError(err,500));
                });
        });
    };


    let updateSeriesVHDSlot=function(seriesName,vhdSlotCount){
        return new Promise((resolve,reject)=>{
            return shelfManagerModel.update({series:seriesName},{$set:{max_inventory:vhdSlotCount}})
                .then((result)=>{
                    if(result.nModified==1){
                        resolve(result);    
                    }
                    else{
                        reject(StandardError(`unable to find series name: ${seriesName}`,400));
                    }
                    return;
                    
                })
                .catch(err=>{
                    reject(StandardError(err,500));
                });
        });

    };
    let addSeriesSubscriber=function(seriesName,visionName){
        let _pushSubscribers=function(seriesName,visionId){
            
            return shelfManagerModel.update(
                {series:seriesName},                        
                {
                    $push:{'subscribers':{vision:visionId}}                            
                },
                {multi:true}
            );        
        };
        let _atomicAddSubscriber=function(seriesName,visionId){        
            return new Promise((resolve,reject)=>{
                let lockName=`_atomicUpdateSubscriber=function(${seriesName},${visionId}){`;
                
                //aquire lock before we add subscriber
                lockControl.Aquire(lockName)
                    .then(()=>{
                        return shelfManagerModel.findOne({series:seriesName});
                    })
                    .then((series)=>{
                        
                        //if we cannot find series, then return error
                        if(series==null){
                            reject(StandardError(`unable to find series ${seriesName}`,400));
                            return;
                        }
    
                        //filter out subscriber and see if there is existing subscriber
                        let result=series.subscribers.filter(item=>{
                            return item.vision==visionId;
                        });
                        if(result.length==0){
                            return _pushSubscribers(seriesName,visionId);
                        }
                    })
                    .then(()=>{
                        return lockControl.Release(lockName);
                    })                                
                    .then(()=>{
                        resolve();
                    })        
                    .catch(err=>{
                        lockControl.Release(lockName)
                            .then(()=>{
                                reject(StandardError(err,500));
                            });                    
                    });
            })
    
    
    
        };
    
        
        return new Promise((resolve,reject)=>{
            visionControl.getVision({name:visionName})
                .then((visionList)=>{
                    //validate # of vision in the list
                    if(visionList.length!=1){
                        reject(StandardError(`there are ${visionList.length} visions associate with name ${visionName}`,400));
                        return;                        
                    }                    
                    let visionId=visionList[0]._id.toString();
                    return _atomicAddSubscriber(seriesName,visionId);
                        
                })
                .then(()=>{
                    resolve();

                })
                .catch(err=>{
                    reject(err);
                });
        });       
        
        
    };

    let delSeriesSubscriber=function(seriesName,visionId){

    };


    return {
        getUploadPath:getUploadPath,
        getVHDDownload:getVHDDownload,
        getVHD:getVHD,
        postSeries:postSeries,
        updateSeriesVHDSlot:updateSeriesVHDSlot,
        addSeriesSubscriber:addSeriesSubscriber,
        delSeriesSubscriber:delSeriesSubscriber,
        getSeriesInfo:getSeriesInfo,
    };
};

module.exports=vhdControl();