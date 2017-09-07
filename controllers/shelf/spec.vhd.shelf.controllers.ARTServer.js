process.env.NODE_ENV = 'test';
var assert = require('assert');

let vhdSupport=require('./support.vhd.shelf.controllers.ARTServer');
//let config=require('../../config');
let fs=require('fs');
let path=require('path');
let vhdModel=require('../../model/shelf/vhd.shelf.model.ARTServer');
let shelfManagerModel=require('../../model/shelf/manager.shelf.model.ARTServer');
var visionModel = require('../../model/vision/vision.model.ARTServer.js');
var taskModel = require('../../model/task/task.model.ARTServer');
var projectBlueprintModel = require('../../model/project/projectBlueprint.model.ARTServer');
var projectModel = require('../../model/project/project.model.ARTServer');
let dormModel = require('../../model/organization/dormModel');
var taskImageDeployment = require('../../model/task/imageDeploy.model.ARTServer');
let visionSupport=require('../vision/support.vision.controllers.ARTServer')

describe('post /shelf/vhd/series/:name',()=>{
    beforeEach((done) => {
        taskModel.remove({})
            .then(()=>{
                return taskImageDeployment.remove({});
            })
            .then(()=>{
                return projectBlueprintModel.remove({});
            })
            .then(()=>{
                return projectModel.remove({});
            })
            .then(()=>{
                return visionModel.remove({});
            })
            .then(()=>{
                return dormModel.remove({});
            })
            .then(()=>{
                return vhdModel.find({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then((vhdList)=>{
                return new Promise((resolve,reject)=>{
                    vhdList.forEach(vhd=>{
                        let vhdpath=path.join(vhd.storage.destination,vhd.storage.filename);
                        fs.unlink(vhdpath,err=>{
                            if(err){
                                reject(err);
                            }                            
                        });                        
                    });
                    resolve();
                    
                });
            })
            .then(()=>{
                return vhdModel.remove({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then(()=>{
                return shelfManagerModel.remove({});
            })
            .then(()=>{
                done();
            });
    });     
        
    it('shall post a new series with name specified',done=>{
        vhdSupport.postSeries('series1')
            .then(()=>{
                return vhdSupport.postSeries('series2');
            })
            .then(()=>{
                return shelfManagerModel.find({});
            })
            .then((managerList)=>{
                assert.equal(managerList.length,2);
                let find1=managerList.find(item=>{
                    return item.series=='series1';
                });
                let find2=managerList.find(item=>{
                    return item.series=='series2';
                });

                assert.notEqual(find1,null);
                assert.notEqual(find2,null);
                done();
            })
            .catch(err=>{
                assert(false,err);
                done();
            });
    });
    it('shall return error when there is existing series with the same name',done=>{
        vhdSupport.postSeries('series1')
            .then((res)=>{
                assert.equal(res.status,200);
                return vhdSupport.postSeries('series1');
            })
            .then((res)=>{
                assert.equal(res.status,400);
                done();
            })
            .catch(err=>{
                assert(false,err);
                done();
            });        
    });
});

describe('get /shelf/vhd/series/',()=>{
    beforeEach((done) => {
        taskModel.remove({})
            .then(()=>{
                return taskImageDeployment.remove({});
            })
            .then(()=>{
                return projectBlueprintModel.remove({});
            })
            .then(()=>{
                return projectModel.remove({});
            })
            .then(()=>{
                return visionModel.remove({});
            })
            .then(()=>{
                return dormModel.remove({});
            })
            .then(()=>{
                return vhdModel.find({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then((vhdList)=>{
                return new Promise((resolve,reject)=>{
                    vhdList.forEach(vhd=>{
                        let vhdpath=path.join(vhd.storage.destination,vhd.storage.filename);
                        fs.unlink(vhdpath,err=>{
                            if(err){
                                reject(err);
                            }                            
                        });                        
                    });
                    resolve();
                    
                });
            })
            .then(()=>{
                return vhdModel.remove({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then(()=>{
                return shelfManagerModel.remove({});
            })
            .then(()=>{
                done();
            });
    });     
     
    it('shall get all series in the db',done=>{
        vhdSupport.postSeries('series1')
            .then(()=>{
                return vhdSupport.postSeries('series2');
            })
            .then(()=>{
                return vhdSupport.getAllSeries();
            })
            .then((output)=>{
                let managerList=output.body;
                assert.equal(managerList.length,2);
                let find1=managerList.find(item=>{
                    return item.series=='series1';
                });
                let find2=managerList.find(item=>{
                    return item.series=='series2';
                });

                assert.notEqual(find1,null);
                assert.notEqual(find2,null);
                done();
            })
            .catch(err=>{
                assert(false,err);
                done();
            });        
    });
});

describe('get /shelf/vhd/series/:name',()=>{
    beforeEach((done) => {
        taskModel.remove({})
            .then(()=>{
                return taskImageDeployment.remove({});
            })
            .then(()=>{
                return projectBlueprintModel.remove({});
            })
            .then(()=>{
                return projectModel.remove({});
            })
            .then(()=>{
                return visionModel.remove({});
            })
            .then(()=>{
                return dormModel.remove({});
            })
            .then(()=>{
                return vhdModel.find({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then((vhdList)=>{
                return new Promise((resolve,reject)=>{
                    vhdList.forEach(vhd=>{
                        let vhdpath=path.join(vhd.storage.destination,vhd.storage.filename);
                        fs.unlink(vhdpath,err=>{
                            if(err){
                                reject(err);
                            }                            
                        });                        
                    });
                    resolve();
                    
                });
            })
            .then(()=>{
                return vhdModel.remove({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then(()=>{
                return shelfManagerModel.remove({});
            })
            .then(()=>{
                done();
            });
    });   

    it('shall return series with name specified',done=>{
        vhdSupport.postSeries('series1')
            .then(()=>{
                return vhdSupport.postSeries('series2');
            })
            .then(()=>{
                return vhdSupport.getSeriesInfo('series1');
            })
            .then((output)=>{
                let managerList=output.body;
                assert.equal(managerList.length,1);
                let find1=managerList.find(item=>{
                    return item.series=='series1';
                });


                assert.notEqual(find1,null);

                done();
            })
            .catch(err=>{
                assert(false,err);
                done();
            });           
    });
    it('shall return nothing with when we cannot find specified series',done=>{
        vhdSupport.postSeries('series1')
            .then(()=>{
                return vhdSupport.postSeries('series2');
            })
            .then(()=>{
                return vhdSupport.getSeriesInfo('seriesxxx');
            })
            .then((output)=>{
                let managerList=output.body;
                assert.equal(managerList.length,0);

                done();
            })
            .catch(err=>{
                assert(false,err);
                done();
            });         
    });
});

describe('put /shelf/vhd/series/:name/slot/:number',()=>{
    beforeEach((done) => {
        taskModel.remove({})
            .then(()=>{
                return taskImageDeployment.remove({});
            })
            .then(()=>{
                return projectBlueprintModel.remove({});
            })
            .then(()=>{
                return projectModel.remove({});
            })
            .then(()=>{
                return visionModel.remove({});
            })
            .then(()=>{
                return dormModel.remove({});
            })
            .then(()=>{
                return vhdModel.find({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then((vhdList)=>{
                return new Promise((resolve,reject)=>{
                    vhdList.forEach(vhd=>{
                        let vhdpath=path.join(vhd.storage.destination,vhd.storage.filename);
                        fs.unlink(vhdpath,err=>{
                            if(err){
                                reject(err);
                            }                            
                        });                        
                    });
                    resolve();
                    
                });
            })
            .then(()=>{
                return vhdModel.remove({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then(()=>{
                return shelfManagerModel.remove({});
            })
            .then(()=>{
                done();
            });
    });   
          
    it('shall update the vhd slot number for series specified',done=>{
        vhdSupport.postSeries('series1')
            .then(()=>{
                return vhdSupport.updateSeriesVHDSlot('series1',5);
            })
            .then(()=>{
                return vhdSupport.getSeriesInfo('series1');
            })
            .then((output)=>{
                let managerList=output.body;
                assert.equal(managerList.length,1);
                let find1=managerList.find(item=>{
                    return item.series=='series1';
                });
                assert.equal(find1.max_inventory,5);
                done();
            })
            .catch(err=>{
                assert(false,err);
            });
        
    });
    it('shall return error when series name is invalid',done=>{
        vhdSupport.postSeries('series1')
            .then(()=>{
                return vhdSupport.updateSeriesVHDSlot('series2',5);
            })
            .then(output=>{
                assert.equal(output.status,400);
                done();
            })
            .catch(err=>{
                assert(false,err);
            });        
    });
    it('shall return error when number is a string',done=>{
        vhdSupport.postSeries('series1')
            .then(()=>{
                return vhdSupport.updateSeriesVHDSlot('series1','abc');
            })
            .then(output=>{
                assert.equal(output.status,400);
                done();
            })
            .catch(err=>{
                assert(false,err);
            });         
    });
    it('shall pass load test',done=>{
        let loadList=[];
        vhdSupport.postSeries('series1')
            .then(()=>{
                for(let i=0;i<100;i++){
                    loadList.push(vhdSupport.updateSeriesVHDSlot('series1',i));
                }
                return Promise.all(loadList);
            })
            .then(()=>{
                assert(true);
                done();
            })
            .catch(err=>{
                assert(false,err);
                done
            });
    });
    
});

describe('put /shelf/vhd/series/:name/subscriber/:vision',()=>{
    beforeEach((done) => {
        taskModel.remove({})
            .then(()=>{
                return taskImageDeployment.remove({});
            })
            .then(()=>{
                return projectBlueprintModel.remove({});
            })
            .then(()=>{
                return projectModel.remove({});
            })
            .then(()=>{
                return visionModel.remove({});
            })
            .then(()=>{
                return dormModel.remove({});
            })
            .then(()=>{
                return vhdModel.find({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then((vhdList)=>{
                return new Promise((resolve,reject)=>{
                    vhdList.forEach(vhd=>{
                        let vhdpath=path.join(vhd.storage.destination,vhd.storage.filename);
                        fs.unlink(vhdpath,err=>{
                            if(err){
                                reject(err);
                            }                            
                        });                        
                    });
                    resolve();
                    
                });
            })
            .then(()=>{
                return vhdModel.remove({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then(()=>{
                return shelfManagerModel.remove({});
            })
            .then(()=>{
                done();
            });
    });   
          
    it('shall add a subscriber vision to series',done=>{
        vhdSupport.postSeries('series1')
            .then(()=>{
                return visionSupport.postNewVision(visionSupport.visionAESChef)
            })
            .then(()=>{
                return vhdSupport.addSeriesSubscriber('series1',visionSupport.visionAESChef.name);
            })
            .then(()=>{
                shelfManagerModel.findOne({series:'series1'})
                    .then((series)=>{
                        assert(series.subscribers.length,1);
                        done();
                    });
            })
            .catch(err=>{
                assert(false,err);
                done();
            });
    });
    it('shall not duplicate vision under load test condition',done=>{
        
        let actions=[];
        vhdSupport.postSeries('series1')
            .then(()=>{
                return visionSupport.postNewVision(visionSupport.visionAESChef)
            })
            .then(()=>{
                return vhdSupport.addSeriesSubscriber('series1',visionSupport.visionAESChef.name);
            })
            .then(()=>{
                return vhdSupport.addSeriesSubscriber('series1',visionSupport.visionAESChef.name);
            })                        
            .then(()=>{
                for(let i=0;i<10;i++){
                    actions.push(vhdSupport.addSeriesSubscriber('series1',visionSupport.visionAESChef.name));
                }
                return Promise.all(actions)
            })
            .then(()=>{
                shelfManagerModel.findOne({series:'series1'})
                    .then((series)=>{
                        assert(series.subscribers.length,1);
                        done();
                    });
            })
            .catch(err=>{
                assert(false,err);
                done();
            });            
    });
    it('shall return error when series name is invalid',done=>{
        vhdSupport.postSeries('series1')
            .then(()=>{
                return visionSupport.postNewVision(visionSupport.visionAESChef)
            })
            .then(()=>{
                return vhdSupport.addSeriesSubscriber('seriesx',visionSupport.visionAESChef.name);
            })
            .then((result)=>{
                assert.equal(result.status,400);
                done();
            })
            .catch(err=>{
                assert(false,err);
                done();
            });        
    });
    it('shall return error when vision name is invalid',done=>{
        vhdSupport.postSeries('series1')
            .then(()=>{
                return visionSupport.postNewVision(visionSupport.visionAESChef)
            })
            .then(()=>{
                return vhdSupport.addSeriesSubscriber('series1','visionSupport.visionAESChef.name');
            })
            .then((result)=>{
                assert.equal(result.status,400);
                done();
            })
            .catch(err=>{
                assert(false,err);
                done();
            });          
    });
});

describe('get /shelf/subscriber/:vision',()=>{
    it('shall get the vhd list for the new vision and update the time stamp specified');
    it('shall not update timestamp when there is nothing new posted');
    it('shall have a performance of less than 500ms/request when we have 100 request coming at the same time');
    it('shall return error when vision name is invalid');
});
describe('delete /shelf/vhd/series/:name/subscriber/:vision',()=>{
    it('shall return error when series name is invalid');
    it('shall deelte the vision name specified');
});
describe('put /shelf/vhd/:id/keeper',()=>{
    it('shall mark specific id as keeper');
    it('shall return status 400 when id is invalid')
});
describe('put /shelf/vhd/:id/dumper',()=>{
    it('shall mark specific id as dumper');
    it('shall return status 400 when id is invalid')
});



describe('post /shelf/vhd',()=>{
    beforeEach((done) => {
        taskModel.remove({})
            .then(()=>{
                return taskImageDeployment.remove({});
            })
            .then(()=>{
                return projectBlueprintModel.remove({});
            })
            .then(()=>{
                return projectModel.remove({});
            })
            .then(()=>{
                return visionModel.remove({});
            })
            .then(()=>{
                return dormModel.remove({});
            })
            .then(()=>{
                return vhdModel.find({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then((vhdList)=>{
                return new Promise((resolve,reject)=>{
                    vhdList.forEach(vhd=>{
                        let vhdpath=path.join(vhd.storage.destination,vhd.storage.filename);
                        fs.unlink(vhdpath,err=>{
                            if(err){
                                reject(err);
                            }                            
                        });                        
                    });
                    resolve();
                    
                });
            })
            .then(()=>{
                return vhdModel.remove({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then(()=>{
                done();
            });



    });      
    it('shall post a vhd',done=>{
        vhdSupport.getUploadPath(vhdSupport.inbuiltJson.upload1,'./controllers/shelf/testfile/test.avhdx')
            .then(()=>{
                vhdModel.find({'content.series':vhdSupport.Constant.TestSeries})
                    .then((results)=>{
                        assert.equal(results.length,1);
                        done();
                    })
                    .catch(err=>{
                        assert(false,err);
                    });
            });
    });

    it('When # of non-keeper vhd exceed shelf manager max inventory count, then delete the oldest non-keeper')
    it('it shall not delete keepr when # of vhd exceed maximum inventory count')
    it('shall upload right amount of file when we have 100 upload happened at the same time',done=>{
        let promiseList=[];
        for(let i=0;i<100;i++){
            promiseList.push(vhdSupport.getUploadPath(vhdSupport.inbuiltJson.upload1,'./controllers/shelf/testfile/test.avhdx'));
        }
        //add 100 vhds
        Promise.all(promiseList)
            .then(()=>{
                //validate the number of vhds
                vhdModel.find({'content.series':vhdSupport.Constant.TestSeries})
                    .then((results)=>{
                        assert.equal(results.length,100);
                        
                        //validate each file is identical to what we uploaded
                        

                        done();
                    })
                    .catch(err=>{
                        assert(false,err);
                    });

            });
    });
    
    
});

describe('get /shelf/vhd',()=>{
    beforeEach((done) => {
        taskModel.remove({})
            .then(()=>{
                return taskImageDeployment.remove({});
            })
            .then(()=>{
                return projectBlueprintModel.remove({});
            })
            .then(()=>{
                return projectModel.remove({});
            })
            .then(()=>{
                return visionModel.remove({});
            })
            .then(()=>{
                return dormModel.remove({});
            })
            .then(()=>{
                return vhdModel.find({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then((vhdList)=>{
                return new Promise((resolve,reject)=>{
                    vhdList.forEach(vhd=>{
                        let vhdpath=path.join(vhd.storage.destination,vhd.storage.filename);
                        fs.unlink(vhdpath,err=>{
                            if(err){
                                reject(err);
                            }                            
                        });                        
                    });
                    resolve();
                    
                });
            })
            .then(()=>{
                return vhdModel.remove({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then(()=>{
                done();
            });



    });      
    it('shall return all possible vhd in the shelf',done=>{
        vhdSupport.getUploadPath(vhdSupport.inbuiltJson.upload1,'./controllers/shelf/testfile/test.avhdx')
            .then(()=>{
                return vhdSupport.getUploadPath(vhdSupport.inbuiltJson.upload2,'./controllers/shelf/testfile/test.avhdx');
            })
            .then(()=>{
                return vhdSupport.getUploadPath(vhdSupport.inbuiltJson.upload3,'./controllers/shelf/testfile/test.avhdx');
            })
            .then(()=>{
                return vhdSupport.getUploadPath(vhdSupport.inbuiltJson.upload4,'./controllers/shelf/testfile/test.avhdx');
            })
            .then(()=>{
                return vhdSupport.getVHD();
            })
            .then((response)=>{
                let vhdList=response.body;
                assert.equal(vhdList.length,4);                
                done();
            })
            .catch(err=>{
                assert(false,err);
            });
    });
});

describe('get /shelf/vhd/download/:id',()=>{
    beforeEach((done) => {
        taskModel.remove({})
            .then(()=>{
                return taskImageDeployment.remove({});
            })
            .then(()=>{
                return projectBlueprintModel.remove({});
            })
            .then(()=>{
                return projectModel.remove({});
            })
            .then(()=>{
                return visionModel.remove({});
            })
            .then(()=>{
                return dormModel.remove({});
            })
            .then(()=>{
                return vhdModel.find({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then((vhdList)=>{
                return new Promise((resolve,reject)=>{
                    vhdList.forEach(vhd=>{
                        let vhdpath=path.join(vhd.storage.destination,vhd.storage.filename);
                        fs.unlink(vhdpath,err=>{
                            if(err){
                                reject(err);
                            }                            
                        });                        
                    });
                    resolve();
                    
                });
            })
            .then(()=>{
                return vhdModel.remove({'content.series':vhdSupport.Constant.TestSeries});
            })
            .then(()=>{
                done();
            });
    });     
    
    it('shall download the vhd with specified id',done=>{
        vhdSupport.getUploadPath(vhdSupport.inbuiltJson.upload1,'./controllers/shelf/testfile/test.avhdx')
            .then(()=>{
                return vhdSupport.getVHD();
            })
            .then(response=>{
                return vhdSupport.getVHDDownload(response.body[0]._id);
            })
            .then(response=>{
                assert.equal(response.header['content-length'],4194304);
                done();
            })
            .catch(err=>{
                assert(false,err);
            });
    });
    it('shall download correctly when 100 instance try to download at the same time',done=>{
        
        vhdSupport.getUploadPath(vhdSupport.inbuiltJson.upload1,'./controllers/shelf/testfile/test.avhdx')
            .then(()=>{
                return vhdSupport.getVHD();
            })
            .then(response=>{
                let taskList=[];
                for(let i=0;i<100;i++){
                    taskList.push(vhdSupport.getVHDDownload(response.body[0]._id));
                }
                    
                return Promise.all(taskList);                       
                    
            })
            .then(response=>{
                
                response.forEach(item=>{
                    assert.equal(item.header['content-length'],4194304);
                });
                
                done();
            })
            .catch(err=>{
                assert(false,err);
            });
        
    });
});

