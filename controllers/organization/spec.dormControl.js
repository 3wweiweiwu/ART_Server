process.env.NODE_ENV='test';
let async=require('async');

const EventEmitter=require('events');
let app=require('../../app.js');
var assert=require('assert');
var dormModel=require('../../model/organization/dormModel');
let dormSupport=require('./support.dorm.controller.ARTServer')
let chai=require('chai');
let chaiHttp=require('chai-http');
let should=chai.should();
chai.use(chaiHttp);

class dormControlEmitter extends EventEmitter{}

const myEmitter=new dormControlEmitter();

const PostDorm=dormSupport.PostDorm

describe('put /dorm/refresh/:dormName',()=>{
    beforeEach((done)=>{
        dormModel.remove({},(err)=>{done()});
    });
    let dorm1={
        name:"test_dorm1",
        system_resource:{
            CPU:38,
            total_memory_mb:4096,
            free_memory_mb:3081,
            disk_total:[
                {
                    drive_letter:"c",
                    total_disk_space_mb:9096,
                    free_disk_space_mb:3084
                },
                {
                    drive_letter:"d",
                    total_disk_space_mb:19096,
                    free_disk_space_mb:33084
                }
            ]
        }
    };    
    it('shall not return error when dorm name is invlaid',done=>{
        dormSupport.RefreshDorm('name')
            .then(()=>{
                assert(false,'it shall return 400 error');
                done();
            })
            .catch(res=>{
                assert.equal(res.status,400);
                
                done();
            });
    });    
    it('shall change the dorms need_update property to true',done=>{
        dormSupport.PostDorm(dorm1)
            .then(()=>{
                return dormModel.findOneAndUpdate({name:dorm1.name},{$set:{need_update:false}});
            })
            .then(()=>{
                return dormModel.find({name:dorm1.name});
            })            
            .then((dormDoc)=>{
                assert.equal(dormDoc[0].need_update,false);                                
                return dormSupport.RefreshDorm(dorm1.name);
            })
            .then(()=>{
                return dormSupport.RefreshDorm(dorm1.name)
            })
            .then(()=>{
                return dormModel.find({name:dorm1.name});
            })
            .then((dormDoc)=>{
                assert.equal(dormDoc[0].need_update,true);
                done();
            })
            .catch(err=>{
                assert(false,err);
                done();
            });
    });
});

describe('dorm',()=>{
    let dorm1={
        name:"test_dorm1",
        system_resource:{
            CPU:38,
            total_memory_mb:4096,
            free_memory_mb:3081,
            disk_total:[
                {
                    drive_letter:"c",
                    total_disk_space_mb:9096,
                    free_disk_space_mb:3084
                },
                {
                    drive_letter:"d",
                    total_disk_space_mb:19096,
                    free_disk_space_mb:33084
                }
            ]
        }
    };
    let dorm2={
        name:"test_dorm2",
        system_resource:{
            CPU:1,
            total_memory_mb:6*1024,
            free_memory_mb:1*1024,
            disk_total:[
                {
                    drive_letter:"c",
                    total_disk_space_mb:9096,
                    free_disk_space_mb:3084
                },
                {
                    drive_letter:"d",
                    total_disk_space_mb:19096,
                    free_disk_space_mb:33084
                }
            ]
        }
    };
    let dorm3={
        name:"test_dorm3",
        system_resource:{
            CPU:5,
            total_memory_mb:6*1024,
            free_memory_mb:1*1024,
            disk_total:[
                {
                    drive_letter:"c",
                    total_disk_space_mb:4096,
                    free_disk_space_mb:3084
                },
                {
                    drive_letter:"d",
                    total_disk_space_mb:19096,
                    free_disk_space_mb:33084
                }
            ]
        }
    };
    
    let dorm1_update={
        name:"test_dorm1",
        system_resource:{
            CPU:2,
            total_memory_mb:9999,
            disk_total:[
                {
                    drive_letter:"c",                    
                    free_disk_space_mb:9999
                }
            ]
        }
    };

    const add3Dorm=(callback)=>{
        chai.request(app).post('/api/dorm').send(dorm1).end((err,res)=>{myEmitter.emit('put 3 dorm');})
        chai.request(app).post('/api/dorm').send(dorm2).end((err,res)=>{myEmitter.emit('put 3 dorm');})
        chai.request(app).post('/api/dorm').send(dorm3).end((err,res)=>{myEmitter.emit('put 3 dorm');})

        let iPut3Dorm=0
        myEmitter.on('put 3 dorm',()=>{
            iPut3Dorm++;
            if(iPut3Dorm==3)
            {
                myEmitter.emit('put 3 dorm finish');
            }
        });
    
    
    }


    describe('/Post dorm',()=>{
        before((done)=>{
            dormModel.remove({},(err)=>{done()});
        });

        it('post a new dorm a new dorm through web api',(done)=>{
            

            chai.request(app)
            .post('/api/dorm')
            .send(dorm1)
            .end((err,res)=>{
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('result').eql('ok')                
                done();
            });


        });

        it('creates a record in db',(done)=>{
            dormModel
            .where("name").equals("test_dorm1")
            .exec((err,query)=>{
                assert(!err===true,err);

                query.length.should.eql(1);
                let doc=query[0]._doc;
                doc.should.have.property("name").eql("test_dorm1");
                doc.system_resource.should.have.property("total_memory_mb").eql(4096);
                doc.system_resource.should.have.property("free_memory_mb").eql(3081);
                doc.system_resource.should.have.property("CPU").eql(38);
                doc.system_resource.disk_total.length.should.eql(2);
                doc.system_resource.disk_total[0].should.have.property("drive_letter").eql("c");
                doc.system_resource.disk_total[0].should.have.property("total_disk_space_mb").eql(9096);
                doc.system_resource.disk_total[0].should.have.property("free_disk_space_mb").eql(3084);
                
                doc.system_resource.disk_total[1].should.have.property("drive_letter").eql("d");
                doc.system_resource.disk_total[1].should.have.property("total_disk_space_mb").eql(19096);
                doc.system_resource.disk_total[1].should.have.property("free_disk_space_mb").eql(33084);
                done();

            });
        });
    });

    describe('/get dorm',()=>{
        before((done)=>{
            dormModel.remove({},(err)=>{done()});
        });

        describe('With clean database and no parameter,',()=>{
            it(' it will return 0 dorm info',(done)=>{
                chai.request(app)
                .get('/api/dorm')
                .end((err,res)=>{
                    res.should.have.status(200);
                    res.body.should.be.a('Array');
                    res.body.length.should.eql(0)
                    done();
                });
            });
        });

        describe('after pump in 3 files',()=>{
            it('shall return 3 dorm info',(done)=>{
                
                myEmitter.on('put 3 dorm finish',()=>{
                    chai.request(app)
                    .get('/api/dorm')
                    .end((err,res)=>{
                        res.should.have.status(200);
                        res.body.should.be.a('Array');
                        res.body.length.should.eql(3);
                        
                        let b1=false;
                        let b2=false;
                        let b3=false;
                        res.body.forEach(function(element) {
                            if(element.name===('test_dorm1')){b1=true;}
                            if(element.name===('test_dorm2')){b2=true;}
                            if(element.name===('test_dorm3')){b3=true;}
                        });
                        
                        assert(b1&&b2&&b3===true);
                        done();                    
                    });
                });
                
                add3Dorm();


            });

            

        });
        



    });

    describe('/put',()=>{
        before((done)=>{
            dormModel.remove({},(err)=>{});
            done();
        });
        
        it('shall response error when updating non-existing server',(done)=>{
            chai
            .request(app)
            .put("/api/dorm")
            .send(dorm1)
            .end((err,res)=>{
                res.should.have.status(500);
                res.body.should.have.property("ERR");
                done();    
            });
            
        });
        it('shall only updated selected field',(done)=>{
            //add 1 dorm model into database
            //add3Dorm(done);

            chai
            .request(app)
            .post("/api/dorm")
            .send(dorm1)
            .end((err,res)=>{
                chai
                .request(app)
                .put("/api/dorm")
                .send(dorm1_update)
                .end((err,res1)=>{
                    dormModel.where('name')
                    .equals(dorm1_update.name)
                    .exec((err,query)=>{
                        
                        result=query[0];
                        assert(result.system_resource.CPU===2,"CPU does not match");
                        assert(result.system_resource.total_memory_mb===9999,"total memory does not match");
                        assert(result.system_resource.disk_total[0].free_disk_space_mb===9999,'free_disk_space does not match');
                        

                        done();
                    });
                });
                
            });



        });
    });

    describe('/get specific dorm',()=>{
        before((done)=>{
            dormModel.remove({},(err)=>{done()});
        });        
        it('shall get specific dorm when 2 dorm exists',(done)=>{
            let PostDorm2=()=>{
                return PostDorm(dorm2);
            }
            let PostDorm3=()=>{
                return PostDorm(dorm3);
            }
            PostDorm(dorm1)
            .then(PostDorm2)
            .then(PostDorm3)
            .then((res)=>{
                chai.request(app)
                .get('/api/dorm/'+dorm3.name)
                .end((err,res)=>{
                    res.should.have.status(200);
                    assert.equal(dorm3.name,res.body[0].name);
                    
                    done();
                });                
            })
        })
    });
});


describe('/dorm/DiskInitializationSignal/:dormName',()=>{
    beforeEach((done)=>{
        dormModel.remove({},(err)=>{done()});
    });      
    it('shall specify the dorm disk space',done=>{
        dormSupport.PostDorm(dormSupport.MVF1)
            .then(()=>{
                return dormSupport.PutDiskInitializationSignal(dormSupport.MVF1.name,dormSupport.Disk1);
            })
            .then(()=>{
                dormModel.findOne({name:dormSupport.MVF1.name})
                    .then((dormDoc)=>{
                        assert.equal(dormDoc.system_resource.disk_total[0].drive_letter,dormSupport.Disk1.diskProfile[0].DriveLetter);
                        assert.equal(dormDoc.system_resource.disk_total[0].total_disk_space_mb,dormSupport.Disk1.diskProfile[0].Size/1024/1024);
                        assert.equal(dormDoc.system_resource.disk_total[0].free_disk_space_mb,dormSupport.Disk1.diskProfile[0].SizeRemaining/1024/1024);

                        assert.equal(dormDoc.system_resource.disk_total[1].drive_letter,dormSupport.Disk1.diskProfile[1].DriveLetter);
                        assert.equal(dormDoc.system_resource.disk_total[1].total_disk_space_mb,dormSupport.Disk1.diskProfile[1].Size/1024/1024);
                        assert.equal(dormDoc.system_resource.disk_total[1].free_disk_space_mb,dormSupport.Disk1.diskProfile[1].SizeRemaining/1024/1024);                        
                        done();
                    })
            })
            .catch(err=>{
                assert(false,err);
                done();
            })
    })
    it('shall return error while dorm name is incorrect',done=>{
        dormSupport.PostDorm(dormSupport.MVF1)
            .then(()=>{
                return dormSupport.PutDiskInitializationSignal('dormSupport.MVF1.name',dormSupport.Disk1);
            })
            .then(()=>{
                assert(false,'it shall return error');
                done();
            })
            .catch(err=>{
                assert(err.status,500)
                done();
            })        
    })
})

describe('put /dorm/:dormName/vm/:size_mb',()=>{
    beforeEach((done)=>{
        dormModel.remove({},(err)=>{done()});
    });       
    it('shall return true and get disk with enough space',done=>{
        dormSupport.PostDorm(dormSupport.MVF1)
            .then(()=>{
                return dormSupport.PutDiskInitializationSignal(dormSupport.MVF1.name,dormSupport.Disk1);
            })
            .then(()=>{
                return dormSupport.PutVMToDorm(dormSupport.MVF1.name,5)
            })
            .then(result=>{
                assert.equal(result.body.result,true);
                done();
            })
            .catch(err=>{
                assert(false,'it shall not fail')
            })
            
    })
    it('shall return false when there is no enough space in disk',done=>{
        dormSupport.PostDorm(dormSupport.MVF1)
            .then(()=>{
                return dormSupport.PutDiskInitializationSignal(dormSupport.MVF1.name,dormSupport.Disk1);
            })
            .then(()=>{
                return dormSupport.PutVMToDorm(dormSupport.MVF1.name,5096*1024*1024)
            })
            .then(result=>{
                assert.equal(result.body.result,false);
                done();
            })
            .catch(err=>{
                assert(false,'it shall not fail')
            })        
    })
    it('shall return error 400 when dormname is invalid',done=>{
        dormSupport.PostDorm(dormSupport.MVF1)
            .then(()=>{
                return dormSupport.PutDiskInitializationSignal(dormSupport.MVF1.name,dormSupport.Disk1);
            })
            .then(()=>{
                return dormSupport.PutVMToDorm('dormSupport.MVF1.name',5096*1024*1024)
            })
            .then(result=>{
                //assert.equal(result.body.result,false);
                assert(false,'it shall pass')
                done();
            })
            .catch(err=>{
                
                assert.equal(err.status,400)
                done();
            })           
    })
    it('shall return error 400 when size_mb is not number',done=>{
        dormSupport.PostDorm(dormSupport.MVF1)
            .then(()=>{
                return dormSupport.PutDiskInitializationSignal(dormSupport.MVF1.name,dormSupport.Disk1);
            })
            .then(()=>{
                return dormSupport.PutVMToDorm(dormSupport.MVF1.name,'5096*1024*1024')
            })
            .then(result=>{
                //assert.equal(result.body.result,false);
                assert(false,'it shall pass')
                done();
            })
            .catch(err=>{
                
                assert.equal(err.status,400)
                done();
            })          
    })
})

describe('delete dorm/:dormName',()=>{
    beforeEach((done)=>{
        dormModel.remove({},()=>{done()});
    });     
    it('shall delete dorm when there is sth existed',done=>{
        dormSupport.PostDorm(dormSupport.dorm1)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm2);
            })
            .then(()=>{
                return dormSupport.DeleteDorm(dormSupport.dorm1.name);
            })
            .then(()=>{
                //there dorm 2 shall be gone while dorm 1 still remains
                dormModel.find({})
                    .then(dormList=>{
                        let dorm1Instance=dormList.find(item=>{return item.name==dormSupport.dorm1.name});
                        let dorm2Instance=dormList.find(item=>{return item.name==dormSupport.dorm2.name});
                        if(dorm1Instance!=null){
                            assert(false,'dorm1 shall be gone');                            
                        }
                        if(dorm2Instance==null){
                            assert(false,'dorm2 shall be still here');                            
                        }                        
                        done();
                    })                    
            });
    });
    it('shall return error when dorm name is empty',done=>{
        dormSupport.PostDorm(dormSupport.dorm1)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm2);
            })
            .then(()=>{
                return dormSupport.DeleteDorm('');
            })
            .then(()=>{
                //there dorm 2 shall be gone while dorm 1 still remains
                assert(false,'it shall not return pass');
                done();
            })
            .catch(err=>{
                assert.equal(err.status,404);
                done();
            })
    });
    it('shall not return error when we cannot find the dorm',done=>{
        dormSupport.PostDorm(dormSupport.dorm1)
            .then(()=>{
                return dormSupport.PostDorm(dormSupport.dorm2);
            })
            .then(()=>{
                return dormSupport.DeleteDorm('dormSupport.dorm1.name');
            })
            .then(()=>{
                //there dorm 2 shall be gone while dorm 1 still remains
                dormModel.find({})
                    .then(dormList=>{
                        let dorm1Instance=dormList.find(item=>{return item.name==dormSupport.dorm1.name});
                        let dorm2Instance=dormList.find(item=>{return item.name==dormSupport.dorm2.name});
                        if(dorm1Instance==null){
                            assert(false,'dorm1 shall be here');                            
                        }
                        if(dorm2Instance==null){
                            assert(false,'dorm2 shall be still here');                            
                        }                        
                        done();
                    })                    
            });         
    });
});