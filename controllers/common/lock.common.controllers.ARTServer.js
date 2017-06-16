let lockModel=require('../../model/utility/lock.utility.model.ARTServer');
let StandardError=require('./error.controllers.ARTServer');

const GetLockStatus=function(lockName){
    return new Promise((resolve,reject)=>{
        lockModel.findon
    });
}
const isLockValid=function(lockId){
    //check if the lock is stil valid
    //if the lock is valid, it will return true
    //otherwise, it will return false
    return new Promise((resolve,reject)=>{
        lockModel.findById(lockId)
            .exec((err,lock)=>{
                if(err){
                    reject(StandardError(err,500));
                }
                else{
                    if(lock==null){
                        resolve(false);
                    }
                    else{
                        resolve(true);
                    }
                    
                }
            });
    });
}

const WaitForAquisition=function(lockId,lockName,resolve,reject){
    //check the validity of the lock id
    isLockValid(lockId)
        .then((isLockValid)=>{
            //if the lock is invalid, then return with error
            if(!isLockValid){
                reject(StandardError('the lock is expired before we try to check it'),500);
                return;
            }
            //waiting until our lock become the first lock
            lockModel.find({name:lockName})
                .exec((err,lockList)=>{
                    if(err){
                        reject(StandardError(err,500));
                        return;
                    }
                    else{
                        //check if our lock is on the top, if so, then we are good
                        let firstLock=lockList[0];
                        if(firstLock._id.toString()==lockId.toString()){
                            resolve(lockId);
                        }
                        else{
                            //update the datetime and then wait for 1s
                            //date the timestamp indicating our lock is still valid
                            lockModel.findOneAndUpdate({_id:lockId},{$set:{createdAt:Date.now()}},(err)=>{
                                if(err){
                                    reject(StandardError(err,500));
                                    return;                            
                                }
                                else
                                {
                                    //after update the timestamp, we wait for 1s for next check
                                    setTimeout(function() {
                                        WaitForAquisition(lockId,lockName,resolve,reject);
                                    }, 1000);
                                }
                            });

                        }
                    }
                });  

        })
        .catch(err=>{
            reject(err);
        });

}
exports.Aquire=function(lockName){
    return new Promise((resolve,reject)=>{
        //create lock
        let lock=new lockModel({
            name:lockName,
            createdAt:Date.now()
        });
        lock.save((err)=>{
            if(err){
                reject(StandardError(err,500));
                return;
            }
            else{
                //wait until lock get aquired
                WaitForAquisition(lock._id,lockName,resolve,reject);
                return;
            }
        })

    });

}

exports.Release=function(lockName){
    return new Promise((resolve,reject)=>{
        lockModel.find({name:lockName})
            .exec((err,locks)=>{
                if(err){
                    reject(StandardError(err,500));
                }
                else{
                    //if we cannot find lock, then just continue
                    if(locks.length==0){
                        resolve();
                        console.warn(`Failed to find ${lockName} in lock list. Please double check`)
                        return;
                    }
                    
                    //remove the first lock
                    let firstLock=locks[0];
                    firstLock.remove((err)=>{
                        if(err){
                            reject(StandardError(err,500));
                        }
                        else{
                            resolve();

                        }
                    })
                    
                }
            });
        
    })
}


