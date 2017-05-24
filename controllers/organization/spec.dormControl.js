process.env.NODE_ENV='test';
let async=require('async');
const EventEmitter=require('events');
let app=require('../../app.js');
var assert=require('assert');
var dormModel=require('../../model/organization/dormModel');
let chai=require('chai');
let chaiHttp=require('chai-http');
let should=chai.should();
chai.use(chaiHttp);

class dormControlEmitter extends EventEmitter{}

const myEmitter=new dormControlEmitter();



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

    const add3Dorm=()=>{
        chai.request(app).post('/api/dorm').send(dorm1).end((err,res)=>{})
        chai.request(app).post('/api/dorm').send(dorm2).end((err,res)=>{})
        chai.request(app).post('/api/dorm').send(dorm3).end((err,res)=>{})
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
                res.body.should.have.property('result').eql('dorm is created successfully')                
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
                add3Dorm();

                
                // let iPut3Dorm=0
                // myEmitter.on('put 3 dorm',()=>{
                //     iPut3Dorm++;
                //     if(iPut3Dorm==3)
                //     {
                //         myEmitter.emit('put 3 dorm finish');
                //     }
                // });
                
                // myEmitter.on('put 3 dorm finish',()=>{});
                
                    
                


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
                    
                });
                done();    
            });

                

        });
        
        describe('/get /dorm?cpu=2&free_memory_mb=1024&free_disk_mb=4096',()=>{
            it('shall return all machines with more than 2 core, 1024mb free memory and 4096 mb of CPU ')

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
                
            });
            done();
        });
        it('shall only updated selected field',(done)=>{
            //add 1 dorm model into database
            add3Dorm();
            chai
            .request(app)
            .put("/api/dorm")
            .send(dorm1_update)
            .end((err,res)=>{
                console.log("hello");
            });
            done();
        });
    });

});


