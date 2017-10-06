let request=require('supertest');
let app = require('../../app');

let SendMail=function(from,to,subject,body,filePath){
    return new Promise((resolve,reject)=>{
        request(app)
            .post('/api/mail')
            .field('Subject',subject)
            .field('From',from)
            .field('To',to)
            .field('Body',body)            
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




module.exports={
    SendMail:SendMail
};