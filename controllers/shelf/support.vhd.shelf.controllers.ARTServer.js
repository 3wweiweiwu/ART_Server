
let chai = require('chai');
let chaiHttp = require('chai-http');
let app = require('../../app.js');
chai.use(chaiHttp);


exports.getUploadPath=(query,cb=()=>{})=>{
    return new Promise((resolve,reject)=>{
        chai
            .request(app)
            .get('/api/shelf/vhd/upload_path')
            .send(query)
            .end((err, res) => {            
                if(err) {
                    reject(err);
                    return cb(err);
                }
                else {
                    resolve(res);
                    return cb(null,res);
                }
            });   
    });
};

exports.jsonUploadPath={
    created_by:'wuwei1',   
    size_byte:'9096',
    os:'windows 10',
    installed_products:[
        {
            name:'Aspen Plus',
            version:'V10',
            build:'2323'
        },
        {
            name:'Aspen HYSYS',
            version:'V11',
            build:'3423'
        }        
    ]       
};

exports.jsonUploadPath={
    created_by:'wuwei1',   
    size_byte:'9096',
    os:'windows 10',
    installed_products:[
        {
            name:'Aspen Plus',
            version:'V10',
            build:'2323'
        },
        {
            name:'Aspen HYSYS',
            version:'V11',
            build:'3423'
        }        
    ]       
};

exports.jsonUploadPath_EmptyCreatedBy={
    size_byte:'9096',
    os:'windows 10',
    installed_products:[
        {
            name:'Aspen Plus',
            version:'V10',
            build:'2323'
        },
        {
            name:'Aspen HYSYS',
            version:'V11',
            build:'3423'
        }        
    ]       
};

exports.jsonUploadPath_EmptySize={
    created_by:'wuwei1',   
    os:'windows 10',
    installed_products:[
        {
            name:'Aspen Plus',
            version:'V10',
            build:'2323'
        },
        {
            name:'Aspen HYSYS',
            version:'V11',
            build:'3423'
        }        
    ]       
};

exports.jsonUploadPath_EmptyOS={
    created_by:'wuwei1',   
    size_byte:'9096',
    installed_products:[
        {
            name:'Aspen Plus',
            version:'V10',
            build:'2323'
        },
        {
            name:'Aspen HYSYS',
            version:'V11',
            build:'3423'
        }        
    ]       
};

exports.jsonUploadPath_EmptyName={
    created_by:'wuwei1',   
    size_byte:'9096',
    os:'windows 10',
    installed_products:[
        {
            name:'Aspen Plus',
            version:'V10',
            build:'2323'
        },
        {
            version:'V11',
            build:'3423'
        }        
    ]       
};