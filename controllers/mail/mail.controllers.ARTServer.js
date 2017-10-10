let StandardError=require('../common/error.controllers.ARTServer');
let fs=require('fs');
let multer=require('multer');
let mailValidation=require('../../validation/mail.validation.ARTServer');
let config=require('../../config');
const nodemailer=require('nodemailer');
let mailControl=function(){
    let upload=multer({
        dest:config.shelf.storage_path,
        limits:{
            fieldSize:655350
        },
        fileFilter:mailValidation.sendMail
    });
    let SendMail=function(from,to,subject,body,storage){
        return new Promise((resolve,reject)=>{
            let transporter = nodemailer.createTransport({
                host: 'smtp.aspentech.local',      
                port:25,      
                secure: false, // true for 465, false for other ports
            });
          
            let mailOptions = {
                from: from, // sender address
                to: to, // list of receivers
                subject: subject, // Subject line
                text: 'Hello world?', // plain text body
                html: body, // html body            
                attachments:[
                    {
                        filename:storage.originalname,
                        path:storage.path
                    }
                ]
            };
          
            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error, info) => {
                //remove file in the storage
                if (error) {
                    
                    fs.unlink(storage.path,()=>{                        
                        reject(StandardError(error,500));    
                        return;
                    });                    
                }
                fs.unlink(storage.path,()=>{                        
                    resolve(info);
                    return;
                });                    
                
          
                
            });
        });

    };



    return{
        SendMail:SendMail,
        multerUpload:upload
    };
};

module.exports=mailControl();