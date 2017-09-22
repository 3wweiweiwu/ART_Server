let vhdModel=require('../../model/shelf/vhd.shelf.model.ARTServer');
let shelfManagerModel=require('../../model/shelf/manager.shelf.model.ARTServer');
let config=require('../../config');
let StandardError=require('../common/error.controllers.ARTServer');
let fs=require('fs');
let visionControl=require('../vision/vision.controllers.ARTServer');
let visionModel=require('../../model/vision/vision.model.ARTServer');
let lockControl=require('../common/lock.common.controllers.ARTServer');
let path=require('path');
let multer=require('multer');
let vhdValidation=require('../../validation/vhd.shelf.validation.ARTServer');
let vhdControl=function(){
    let upload=multer({
        dest:config.shelf.storage_path,
        limits:{
            fileSize:9999999999999,        
        },
        fileFilter:vhdValidation.upload
    });
    let getUploadPath=function(createdBy,os,productList,mediaList,storageInfo,series){
        let _removeOldVHD=function(series){
            return new Promise((resolve,reject)=>{
                //get respective series manager to get max inventory
                let todo=[];
                todo.push(shelfManagerModel.findOne({series:series}));
                
                //push the vhd
                todo.push(vhdModel.find({
                    $and:[
                        {'content.series':series},
                        {$or:[
                            {'content.is_keeper':false},
                            {'content.is_keeper':null},
                        ]}
                    ]})
                    .sort('-created.at')
                );
                Promise.all(todo)
                    .then((result)=>{
                        //get the max inventory from series with default value of 3
                        let series=result[0];
                        let maxInventory=3;
                        if(series!=null){
                            maxInventory=series.max_inventory;
                        }

                        //if the vhd count is greater than our inventory, then delete early ones
                        let vhdList=result[1];
                        let pendingDelete=[];
                        if(vhdList.length>maxInventory){
                            for(let i=maxInventory;i<vhdList.length;i++){
                                
                                //delete file
                                pendingDelete.push(new Promise((resolve)=>{
                                    let filePath=vhdList[i].storage.path;
                                    fs.unlink(filePath,err=>{
                                        if(err){
                                            console.log(err);
                                        }
                                        resolve();
                                    });
                                }));

                                //delete record
                                pendingDelete.push(vhdModel.remove({_id:vhdList[i]._id.toString()}));
                            }
                        }
                        else{
                            //vhd count is less than inventory maximum, we are all good
                            resolve();
                        }
                        
                        return Promise.all(pendingDelete);

                    })
                    .then((result)=>{
                        resolve(result);
                    })
                    .catch(err=>{
                        reject(StandardError(err,500));
                    });
            });
        };
        
        return new Promise((resolve,reject)=>{
            //create a new vhd record
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
            vhdDoc.save()
                .then(()=>{
                    return _removeOldVHD(series);
                })
                .then(()=>{
                    resolve(vhdDoc._id);
                    return;
                })
                .catch(err=>{
                    reject(StandardError(err,500));
                    return;
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
    let _sanitizeVHDInfo=function(vhdInfoList){
        let results=vhdInfoList;
        
        results.forEach(item=>{
            let tempOriginalName=item.storage.originalname;
            item.storage='';
            item.storage.originalname=tempOriginalName;
        });

        return results;
    };
    let getVHD=function(query){
        return new Promise((resolve,reject)=>{
            vhdModel.find(query)
                .then(results=>{
                    //sanitize result, remove all storage info except for size
                    // results.forEach(item=>{
                    //     let tempOriginalName=item.storage.originalname;
                    //     item.storage='';
                    //     item.storage.originalname=tempOriginalName;
                    // });
                    let cleanResult=_sanitizeVHDInfo(results);
                    resolve(cleanResult);
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
                    $push:{
                        'subscribers':{
                            vision:visionId,
                            last_visited:Date.now()
                        }
                    }                            
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
            });
    
    
    
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

    let getSubscription=function(seriesName,visionName){
        let _updateLastVisitedTime=function(result,seriesName,visionName){
            return new Promise((resolve,reject)=>{
                let seriesList=result[0];
                if(seriesList==null || seriesList.length==0){
                    //series is invalid
                    reject(StandardError(`unable to find series name ${seriesName}`,400));
                    return;
                }
                else if(seriesList.length!=1){
                    //more than 1 instance error
                    reject(StandardError(`internal error when series name ${seriesName}. More than 1 instance`,500));
                    return;
                }
    
                let seriesObj=seriesList[0];
    
                let vision=result[1];
                if(vision==null){
                    reject(StandardError(`unable to find vision ${visionName}`));
                    return;
                }
                
                let subscriberIndex=seriesObj.subscribers.findIndex(item=>{
                    return item.vision.toString()==vision._id.toString();
                });
                let last=seriesObj.subscribers[subscriberIndex].last_visited;
                
                //update last visited time
                seriesObj.subscribers[subscriberIndex].last_visited=Date.now();
    
                seriesObj.save(err=>{
                    if(err){
                        reject(StandardError(err,500));
                    }
                    else
                    {
                        resolve(last);
                    }
                });
    
                
            });
        };            


        return new Promise((resolve,reject)=>{
            let todoList=[];
            todoList.push(getSeriesInfo(seriesName));
            todoList.push(visionModel.findOne({name:visionName}));
            Promise.all(todoList)
                .then(result=>{
                    return _updateLastVisitedTime(result,seriesName,visionName);
                })
                .then(last_visited=>{
                    //find out series that is created after the last visited time
                    return vhdModel.find(
                        {
                            $and:[
                                {
                                    $or:[
                                        {'content.series':seriesName},
                                        {'content.series':`"${seriesName}"`}
                                    ]
                                }
                                ,{
                                    'created.at':{$gte:last_visited}
                                }
                                
                            ]
                            
                        }
                    );
                    // return vhdModel.find({'content.series':seriesName});
                })
                .then(result=>{
                    let cleanResult=_sanitizeVHDInfo(result);
                    resolve(cleanResult);
                })
                .catch(err=>{
                    if(err.status==undefined){
                        reject(StandardError(err,500));
                    }
                    else{
                        reject(err);
                    }
                });
            

        });

    };
    let delSeriesSubscriber=function(seriesName,visionId){
        //why do I need to delte that? If I use it, it is useful, if not..who cares...
        if(visionId){
            visionId++;
        }
    };
    let updateVHDKeeperInfo=function(vhdId,isKeeper){
        return new Promise((resolve,reject)=>{
            vhdModel.findOneAndUpdate({_id:vhdId},{'content.is_keeper':isKeeper},((err,result)=>{
                if(err){
                    reject(StandardError(err,500));
                    return;
                }
                else{
                    if(result==null){
                        //there is nothing found, then return error
                        reject(StandardError(`unable to find vhd with ${vhdId}`,400));
                    }
                    else{
                        resolve(result);
                    }
                }
            }));
        
        });
    };
    function extendMulterUploadTimeout (req, res, next) {
        res.setTimeout(480000, function () { /* Handle timeout */ });
        next();
    
    }
    function getVHDSize(vhdId){
        return new  Promise((resolve,reject)=>{
            vhdModel.findById(vhdId)
                .then(vhd=>{
                    if(vhd!=null){
                        fs.stat(vhd.storage.path,(err,stat)=>{
                            if(err){
                                reject(err);
                                return;
                            }
                            else{
                                resolve(stat.size);
                                return;
                            }
                        });
                    }
                    else{
                        reject(StandardError(`unable to access file specified for ${vhdId}`,500));
                        return;
                    }
                    
                })
                .catch(err=>{
                    reject(StandardError(err,500));
                });
        });
        

    }
    return {
        getUploadPath:getUploadPath,
        getVHDDownload:getVHDDownload,
        getVHD:getVHD,
        postSeries:postSeries,
        updateSeriesVHDSlot:updateSeriesVHDSlot,
        addSeriesSubscriber:addSeriesSubscriber,
        delSeriesSubscriber:delSeriesSubscriber,
        getSeriesInfo:getSeriesInfo,
        getSubscription:getSubscription,
        updateVHDKeeperInfo:updateVHDKeeperInfo,
        multerUpload:upload,
        extendMulterUploadTimeout:extendMulterUploadTimeout,
        getVHDSize:getVHDSize
    };
};

module.exports=vhdControl();