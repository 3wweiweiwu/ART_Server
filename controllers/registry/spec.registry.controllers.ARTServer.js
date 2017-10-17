process.env.NODE_ENV = 'test';
var assert = require('assert');
var registryModel = require('../../model/registry/registry.model.ARTServer');
var registrySupport = require('../../controllers/registry/support.registry.controllers.ARTServer');


let chai = require('chai');
let chaiHttp = require('chai-http');

chai.use(chaiHttp);
describe('put /registry/ision/:vision/project/:project/task/:task/key/:key/expired',()=>{
    beforeEach(done=>{
        registryModel.remove()
            .exec(()=>{done();});
    });      
    it('shall mark specific registry expired',done=>{
        registrySupport.postRegistry('vision','project','task','key1','value1')
            .then(()=>{
                return registrySupport.getCompleteRegistry('vision','project','task','key1');                
            })
            .then((registry)=>{
                assert.equal(registry.body.expired,false);
                return registrySupport.setRegistryExpired('vision','project','task','key1');
            })
            .then(()=>{
                return registrySupport.getCompleteRegistry('vision','project','task','key1');                
            })            
            .then((registry)=>{
                assert.equal(registry.body.expired,true);
                done();
            })
            .catch(err=>{
                assert(false,err);
                done();
            });
    });
    it('shall not create new registry if specified registry cannot be found',done=>{

        registrySupport.setRegistryExpired('vision','project','task','key2')            
            .then(()=>{
                return registrySupport.getCompleteRegistry('vision','project','task','key2');                
            })            
            .then(()=>{
                assert(false,'it shall return error');
                done();
            })
            .catch(err=>{
                assert.equal(400,err.err.status);
                done();
            });
        
    });
});
describe('post /registry/vision/:vision/project/:project/task/:task/key/:key',()=>{
    beforeEach(done=>{
        registryModel.remove()
            .exec(()=>{done();});
    });
    
    it('shall create a new registry against path specified',done=>{
        registrySupport.postRegistry('vision','project','task','key1','value1')
            .then(()=>{
                registryModel.findOne({vision:'vision',project:'project',task:'task',key:'key1',value:'value1'})
                    .exec((err,registry)=>{
                        assert.notEqual(registry,null);
                        done();
                    });
            })
            .catch(err=>{
                assert(false,err);
            });
    });
    it('shall override existing registry against path specified',done=>{
        registrySupport.postRegistry('vision','project','task','key1','value1')
            .then(()=>{
                //override existing value
                return registrySupport.postRegistry('vision','project','task','key1','value2');
            })        
            .then(()=>{
                registryModel.find({vision:'vision',project:'project',task:'task',key:'key1'})
                    .exec((err,registryList)=>{
                        assert.equal(registryList.length,1);
                        assert.equal(registryList[0].value,'value2');
                        done();
                    });
            })
            .catch(err=>{
                assert(false,err);
            });
    });
    it('shall update registry time stamp and mark registry as unexpired',done=>{
        let result={};
        registrySupport.postRegistry('vision','project','task','key1','value1')
            .then(()=>{
                return registrySupport.getCompleteRegistry('vision','project','task','key1');
            })
            .then(value1=>{
                result.value1=value1.body;
                return registrySupport.postRegistry('vision','project','task','key1','value1');
            })
            .then(()=>{
                return registrySupport.getCompleteRegistry('vision','project','task','key1');
            })
            .then(value2=>{
                assert.equal(result.value1.expired,false);
                assert.notEqual(result.value1.timestamp,value2.body.timestamp);
                done();
            })
            .catch(err=>{
                assert(false,err);
                done();
            });
    });
    it('shall mark expired registry as unexpired',done=>{
        registrySupport.postRegistry('vision','project','task','key1','value1')
            .then(()=>{
                return registrySupport.setRegistryExpired('vision','project','task','key1');
            })
            .then(()=>{
                return registrySupport.postRegistry('vision','project','task','key1','value1');
            })
            .then(()=>{
                return registrySupport.getCompleteRegistry('vision','project','task','key1');
            })
            .then(value2=>{                
                assert.equal(false,value2.body.expired);
                done();
            })
            .catch(err=>{
                assert(false,err);
                done();
            });            
    });
});

describe('get /registry/ision/:vision/project/:project/task/:task/key/:key/expired',()=>{
    beforeEach(done=>{
        registryModel.remove()
            .exec(()=>{done();});
    });      
    it('shall return if specific registry expired',done=>{
        registrySupport.postRegistry('vision','project','task','key1','value1')
            .then(()=>{
                return registrySupport.isRegistryExpired('vision','project','task','key1');
            })
            .then(result=>{
                assert.equal(false,result.body.expired);
                return registrySupport.setRegistryExpired('vision','project','task','key1');
            })
            .then(()=>{
                return registrySupport.isRegistryExpired('vision','project','task','key1');
            })
            .then(result=>{
                assert.equal(true,result.body.expired);
                done();
            })
            .catch(err=>{
                assert(false,err);
                done();
            });
    });    
    it('shall return 400 error if registry specified cannot be found',done=>{
        registrySupport.isRegistryExpired('vision','project','task','key1')
            .then(()=>{
                assert(false,'it shall return 400 error for non-exist registry');
            })
            .catch(err=>{
                assert.equal(err.err.status,400);
                done();
            });
    });
});
describe('get /registry/vision/:vision/project/:project/task/:task/key/:key',()=>{
    beforeEach(done=>{
        registryModel.remove()
            .exec(()=>{done();});
    });    
    it('shall return the registry specified',done=>{
        //post registry
        registrySupport.postRegistry('vision','project','task','key1','value1')
            .then(()=>{
                //override existing value
                return registrySupport.postRegistry('vision','project','task','key2','value2');
            })          
            .then(()=>{
                //get registry
                return registrySupport.getRegistry('vision','project','task','key1');
            })
            .then(result=>{
                assert(result.body.result,'value1');
                done();
            })
            .catch(err=>{
                assert(false,err);
            });
        
    });
    it('shall return 400 error when path specified does not exists',done=>{
        registrySupport.getRegistry('vision','project','task','key1')
            .then(()=>{
                assert(false,'it shall not return pass');
            })
            .catch((err)=>{
                assert.equal(err.err.status,400);
                done();
            });
    });
});