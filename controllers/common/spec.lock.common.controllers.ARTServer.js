let lockControl=require('./lock.common.controllers.ARTServer')
let lockModel=require('../../model/utility/lock.utility.model.ARTServer')
var assert = require('assert');
describe('lock aquisition',()=>{
    beforeEach(done=>{
        lockModel.remove({},()=>{
            done();
        })
    })
    const lock1='lock1';
    const lock2='lock2';
    const lock3='lock3';
    it('shall aquire lock',done=>{
        
        lockControl.Aquire(lock1)
        .then(()=>{
            lockModel.find({name:lock1})
                .then(locks=>{
                    assert.equal(locks.length,1);
                    assert.equal(locks[0].name,lock1);
                    done();
                })
                

        })
        .catch((err)=>{
            done();
        })
    })

    it('shall aquire lock and release single lock correctly',done=>{
        
        lockControl.Aquire(lock1)
        .then(()=>{
            return lockControl.Release(lock1);
        })
        .then(()=>{
            lockModel.find({name:lock1})
                .then(locks=>{
                    assert.equal(locks.length,0);
                    
                    done();
                })
                

        })
        .catch((err)=>{
            done();
        })
    })    

    
    it('shall not throw error if releasing an inexists lock',done=>{
        
        lockControl.Aquire(lock1)
        .then(()=>{
            return lockControl.Release(lock2);
        })
        .then(()=>{
            lockModel.find({name:lock1})
                .then(locks=>{
                    assert.equal(locks.length,1);
                    assert.equal(locks[0].name,lock1);
                    done();
                })
                

        })
        .catch((err)=>{
            done();
        })
    })  

    it('shall release lock in sequence',done=>{
        
        lockControl.Aquire(lock1)
        .then(()=>{
            return new Promise((resolve,reject)=>{
                let lock=new lockModel({name:lock1});
                lock.save(()=>{resolve();})
            });
        })
        .then(()=>{
            lockModel.find({name:lock1})
                .then(locks=>{
                    assert.equal(locks.length,2);
                    let secondLock=locks[1];

                    lockControl.Release(lock1)
                        .then(()=>{
                            lockModel.find({name:lock1})
                                .exec((err,newLockList)=>{
                                    assert.equal(newLockList.length,1);
                                    assert.equal(secondLock._id,newLockList[0]._id);
                                    done();
                                });
                        })

                })
                

        })
        .catch((err)=>{
            done();
        })
    })      

})