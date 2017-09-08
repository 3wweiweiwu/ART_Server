let request=require('supertest');
let app = require('../../app.js');

let Constant={
    TestSeries:'testSeries'
};
let inbuiltJson={
    upload1:{
        created_by:'me',
        os:'10',
        series:'test',
        installed_products:[
            {
                name:'a+',
                version:'10',
                build:50
            },
            {
                name:'hysys',
                version:'10',
                build:55
            }
        ],
        installed_media:'AspenONE50'

    },
    upload2:{
        created_by:'me',
        os:'10',
        series:'test',
        installed_products:[
            {
                name:'a+',
                version:'10.1',
                build:50
            },
            {
                name:'hysys',
                version:'10.1',
                build:55
            }
        ],
        installed_media:'AspenONE50'

    },   
    upload3:{
        created_by:'me',
        os:'10',
        series:'test',
        installed_products:[
            {
                name:'a+',
                version:'10.2',
                build:50
            },
            {
                name:'hysys',
                version:'10.2',
                build:55
            }
        ],
        installed_media:'AspenONE50'

    },      
    upload4:{
        created_by:'me',
        os:'10',
        series:'test',
        installed_products:[
            {
                name:'a+',
                version:'10.3',
                build:50
            },
            {
                name:'hysys',
                version:'10.3',
                build:55
            }
        ],
        installed_media:'AspenONE50'

    },          
};


let getUploadPath=function(fieldInfo,filePath){
    return new Promise((resolve,reject)=>{
        request(app)
            .post('/api/shelf/vhd')
            .field('created_by',fieldInfo.created_by)
            .field('os',fieldInfo.os)
            .field('series',Constant.TestSeries)
            .field('installed_products',JSON.stringify(fieldInfo.installed_products))
            .field('installed_media',JSON.stringify(fieldInfo.installed_media))
            .attach('file',filePath)
            .end((err,res)=>{
                if(err){
                    reject(err);
                }
                else{
                    resolve(res);
                }
            });
    });

};

let getVHD=function(){
    return new Promise((resolve,reject)=>{
        request(app)
            .get('/api/shelf/vhd')
            .end((err,res)=>{
                if(err){
                    reject(err);
                }
                else{
                    resolve(res);
                }
            });
    });

};


let getVHDDownload=function(id){
    return new Promise((resolve,reject)=>{
        request(app)
            .get(`/api/shelf/vhd/download/${id}`)
            .end((err,res)=>{
                if(err){
                    reject(err);
                }
                else{
                    resolve(res);
                }
            });
    });

};
let postSeries=function(name){
    return new Promise((resolve,reject)=>{
        request(app)
            .post(`/api/shelf/vhd/series/${name}`)
            .end((err,res)=>{
                if(err){
                    reject(err);
                }
                else{
                    resolve(res);
                }
            });
    });

};

let getAllSeries=function(){
    return new Promise((resolve,reject)=>{
        request(app)
            .get('/api/shelf/vhd/series')
            .end((err,res)=>{
                if(err){
                    reject(err);
                }
                else{
                    resolve(res);
                }
            });
    });

};

let getSeriesInfo=function(name){
    return new Promise((resolve,reject)=>{
        request(app)
            .get(`/api/shelf/vhd/series/${name}`)
            .end((err,res)=>{
                if(err){
                    reject(err);
                }
                else{
                    resolve(res);
                }
            });
    });

};

let updateSeriesVHDSlot=function(seriesName,slotNumber){
    return new Promise((resolve,reject)=>{
        request(app)
            .put(`/api/shelf/vhd/series/${seriesName}/slot/${slotNumber}`)
            .end((err,res)=>{
                if(err){
                    reject(err);
                }
                else{
                    resolve(res);
                }
            });
    });

};

let addSeriesSubscriber=function(seriesName,visionName){
    return new Promise((resolve,reject)=>{
        request(app)
            .put(`/api/shelf/vhd/series/${seriesName}/subscriber/${visionName}`)
            .end((err,res)=>{
                if(err){
                    reject(err);
                }
                else{
                    resolve(res);
                }
            });
    });

};

let getShelfSubscription=function(seriesName,visionName){
    return new Promise((resolve,reject)=>{
        request(app)
            .get(`/api/shelf/vhd/series/${seriesName}/subscriber/${visionName}/feed`)
            .end((err,res)=>{
                if(err){
                    reject(err);
                }
                else{
                    resolve(res);
                }
            });
    });
};

let delSeriesSubscriber=function(seriesName,visionName){
    return new Promise((resolve,reject)=>{
        request(app)
            .delete(`/api/shelf/vhd/series/${seriesName}/subscriber/${visionName}`)
            .end((err,res)=>{
                if(err){
                    reject(err);
                }
                else{
                    resolve(res);
                }
            });
    });
};
let markVHDKeeper=function(vhdId){
    return new Promise((resolve,reject)=>{
        request(app)
            .put(`/api/shelf/vhd/${vhdId}/keeper`)
            .end((err,res)=>{
                if(err){
                    reject(err);
                }
                else{
                    resolve(res);
                }
            });
    });
};
let markVHDDumper=function(vhdId){
    return new Promise((resolve,reject)=>{
        request(app)
            .put(`/api/shelf/vhd/${vhdId}/dumper`)
            .end((err,res)=>{
                if(err){
                    reject(err);
                }
                else{
                    resolve(res);
                }
            });
    });
};
module.exports={
    getUploadPath:getUploadPath,
    getVHD:getVHD,
    getVHDDownload:getVHDDownload,
    inbuiltJson:inbuiltJson,
    Constant:Constant,
    postSeries:postSeries,
    getAllSeries:getAllSeries,
    getSeriesInfo:getSeriesInfo,
    updateSeriesVHDSlot:updateSeriesVHDSlot,
    addSeriesSubscriber:addSeriesSubscriber,
    getShelfSubscription:getShelfSubscription,
    delSeriesSubscriber:delSeriesSubscriber,
    markVHDKeeper:markVHDKeeper,
    markVHDDumper:markVHDDumper
};
