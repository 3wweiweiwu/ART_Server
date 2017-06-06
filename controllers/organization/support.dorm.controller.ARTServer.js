let app = require('../../app.js');
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
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
                cb(null,res)
            }
                
        });
    });

}
exports.dorm1={
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
exports.dorm2={
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
exports.dorm3={
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
 