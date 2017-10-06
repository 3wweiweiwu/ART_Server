process.env.NODE_ENV = 'test';
var assert = require('assert');



let mailSupport=require('../mail/support.mail.controllers.ARTServer');

describe('post /mail',()=>{
    it('shall send a mail with attachment',done=>{
        mailSupport.SendMail('weiwei.wu@aspentech.com','weiwei.wu@aspentech.com,3wweiweiwu@gmail.com','test','this is test','./controllers/shelf/testfile/a.txt')
            .then(result=>{
                assert.equal(result.status,200);
                done();
            })
            .catch(err=>{
                assert(false,err);
                done();
            });

    });    

});