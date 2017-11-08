let app = require('../../app.js');
let chai = require('chai');
let chaiHttp = require('chai-http');

chai.use(chaiHttp);
exports.PostDorm=function(dormObj,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai.request(app)
            .post('/api/dorm')
            .send(dormObj)
            .end((err,res)=>{
                if(err){
                    reject(err);
                    return cb(err,null);
                }
                
                else{
                    resolve(res);
                    cb(null,res);
                }
                
            });
    });

};

exports.PostDormWithCheck=function(dormObj){
    return new Promise((resolve,reject)=>{
        chai.request(app)
            .get(`/api/dorm/${dormObj.name}`)
            .send(dormObj)
            .end((err,res)=>{
                if(err){
                    reject(err);
                    
                }
                
                else{
                    
                    if(res.body.length==0){
                        exports.PostDorm(dormObj)
                            .then((res)=>{
                                resolve(res);
                            });
                    }
                    else
                    {
                        resolve(res);
                    }
                    
                }
                
            });
    });
};
exports.PutVMToDorm=function(dormName,size_mb,drive_letter='*',cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai.request(app)
            .put(`/api/dorm/${dormName}/vm/${size_mb}/drive/${drive_letter}`)        
            .end((err,res)=>{
                if(err){
                    reject(err);
                    return cb(err,null);
                }
                
                else{
                    resolve(res);
                    cb(null,res);
                }
                
            });
    });

};
exports.DeleteDorm=function(dormName,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai.request(app)
            .del(`/api/dorm/${dormName}`)        
            .end((err,res)=>{
                if(err){
                    reject(err);
                    return cb(err,null);
                }
                
                else{
                    resolve(res);
                    cb(null,res);
                }
                
            });
    });

};
exports.PutDiskInitializationSignal=function(dormName,diskObj,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai.request(app)
            .put(`/api/dorm/DiskInitializationSignal/${dormName}`)
            .send(diskObj)
            .end((err,res)=>{
                if(err){
                    reject(err);
                    return cb(err,null);
                }
                
                else{
                    resolve(res);
                    cb(null,res);
                }
                
            });
    });

};

exports.RefreshDorm=function(dormName,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        chai.request(app)
            .put(`/api/dorm/refresh/${dormName}`)
            .end((err,res)=>{
                if(err){
                    reject(err);
                    return cb(err,null);
                }
                
                else{
                    resolve(res);
                    cb(null,res);
                }
                
            });
    });

};

exports.Disk1={
    diskProfile:[
        {
            DriveLetter:'e',
            Size:4096*1024*1024,
            SizeRemaining:1024*1024*1024
        },
        {
            DriveLetter:'c',
            Size:1096*1024*1024,
            SizeRemaining:24*1024*1024
        }
    ]
};
exports.qe_mtell_01={
    name:'QE-MTELL-01',
    system_resource:{
        CPU:38,
        total_memory_mb:99096,
        free_memory_mb:90000,
        disk_total:[
            {
                drive_letter:'c',
                total_disk_space_mb:90960,
                free_disk_space_mb:90840
            },
            {
                drive_letter:'e',
                total_disk_space_mb:909096,
                free_disk_space_mb:200000
            }
        ]
    }    
};
exports.MVF1={
    name:'MVF1',
    system_resource:{
        CPU:38,
        total_memory_mb:99096,
        free_memory_mb:90000,
        disk_total:[
            {
                drive_letter:'c',
                total_disk_space_mb:9096,
                free_disk_space_mb:3084
            },
            {
                drive_letter:'d',
                total_disk_space_mb:19096,
                free_disk_space_mb:33084
            }
        ]
    }    
};
exports.HQDEVBLADE28={
    name:'HQDEVBLADE28',
    system_resource:{
        CPU:38,
        total_memory_mb:99096,
        free_memory_mb:90000,
        disk_total:[
            {
                drive_letter:'H',
                total_disk_space_mb:1.8*1024,
                free_disk_space_mb:1.5*1024
            }
        ]
    }    
};

exports.HOUQAEBLADE114={
    name:'HOUQAEBLADE114',
    system_resource:{
        CPU:38,
        total_memory_mb:99096,
        free_memory_mb:90000,
        disk_total:[
            {
                drive_letter:'C',
                total_disk_space_mb:9096,
                free_disk_space_mb:3084
            }
        ]
    }    
};
exports.SHQEANALYTICS3={
    name:'SHQEANALYTICS3',
    system_resource:{
        CPU:38,
        total_memory_mb:99096,
        free_memory_mb:90000,
        disk_total:[
            {
                drive_letter:'C',
                total_disk_space_mb:9096,
                free_disk_space_mb:3084
            }
        ]
    }    
};
exports.HQDEVRACK2={
    name:'HQDEVRACK2',
    system_resource:{
        CPU:38,
        total_memory_mb:99096,
        free_memory_mb:90000,
        disk_total:[
            {
                drive_letter:'C',
                total_disk_space_mb:9096,
                free_disk_space_mb:3084
            }
        ]
    }    
};
exports.WUWEI1={
    name:'WUWEI1',
    system_resource:{
        CPU:38,
        total_memory_mb:99096,
        free_memory_mb:90000,
        disk_total:[
            {
                drive_letter:'C',
                total_disk_space_mb:9096,
                free_disk_space_mb:3084
            }
        ]
    }    
};
exports.JAYAPRAA1={
    name:'JAYAPRAA1',
    system_resource:{
        CPU:4,
        total_memory_mb:16257.94921875,
        free_memory_mb:6205.3046875,
        disk_total:[
            {
                drive_letter:'D',
                total_disk_space_mb:476937.99609375,
                free_disk_space_mb:322590.8203125
            }
        ]
    }    
};
exports.HOUQAEBLADE12={
    name:'HOUQAEBLADE12',
    system_resource:{
        CPU:38,
        total_memory_mb:131037.26953125,
        free_memory_mb:100197.453125,
        disk_total:[
            {
                drive_letter:'E',
                total_disk_space_mb:2097148.99609375,
                free_disk_space_mb:1390084.421875
            }
        ]
    }    
};
exports.MVF2={
    name:'MVF2',
    system_resource:{
        CPU:38,
        total_memory_mb:99096,
        free_memory_mb:90000,
        disk_total:[
            {
                drive_letter:'C',
                total_disk_space_mb:9096,
                free_disk_space_mb:3084
            }
        ]
    }    
};
exports.HQQAEBLADE02={
    name:'HQQAEBLADE02',
    system_resource:{
        CPU:38,
        total_memory_mb:99096,
        free_memory_mb:90000,
        disk_total:[
            {
                drive_letter:'C',
                total_disk_space_mb:9096,
                free_disk_space_mb:3084
            }
        ]
    }    
};
exports.dorm1={
    name:'test_dorm1',
    system_resource:{
        CPU:38,
        total_memory_mb:99096,
        free_memory_mb:90000,
        disk_total:[
            {
                drive_letter:'c',
                total_disk_space_mb:9096,
                free_disk_space_mb:3084
            },
            {
                drive_letter:'d',
                total_disk_space_mb:19096,
                free_disk_space_mb:33084
            }
        ]
    }
};
exports.dorm2={
    name:'test_dorm2',
    system_resource:{
        CPU:1,
        total_memory_mb:6*1024,
        free_memory_mb:1*1024,
        disk_total:[
            {
                drive_letter:'c',
                total_disk_space_mb:9096,
                free_disk_space_mb:3084
            },
            {
                drive_letter:'d',
                total_disk_space_mb:19096,
                free_disk_space_mb:33084
            }
        ]
    }
};
exports.dorm3={
    name:'test_dorm3',
    system_resource:{
        CPU:5,
        total_memory_mb:6*1024,
        free_memory_mb:1*1024,
        disk_total:[
            {
                drive_letter:'c',
                total_disk_space_mb:4096,
                free_disk_space_mb:3084
            },
            {
                drive_letter:'d',
                total_disk_space_mb:19096,
                free_disk_space_mb:33084
            }
        ]
    }
};
 