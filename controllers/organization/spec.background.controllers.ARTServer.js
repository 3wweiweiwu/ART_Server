// process.env.NODE_ENV = 'test';
// let async = require('async');
// const EventEmitter = require('events');
// let app = require('../../app.js');
// var assert = require('assert');
// var backgroundModel = require('../../model/organization/background.Model.js');

// let chai = require('chai');
// let chaiHttp = require('chai-http');
// let should = chai.should();
// chai.use(chaiHttp);

// describe('background', () => {
//     const media_farmer = {
//         name: "media_farmer",
//         des:"install aes media",
//         qualification: [
//             {task_name:'aes_installer'},
//             {task_name:'psc_installer'},
//             {task_name:'image_deployment_2016'}
//         ]
//     };
//     const media_farmer1 = {
//         name: "aes_media_farmer",
//         des:'install latest aes media',
//         qualification: [
//             {task_name:'aes_installer'},
//             {task_name:'psc_installer'},
//             {task_name:'image_deployment_2017'}
//         ]
//     };
//     const noname_background={
//         requirement:[]
//     }
//     const norequirement_background = {
//         name: "scm_test_runner"
//     };
//     const mvt_runner_2 = {
//         name: "scm_test_runner",
//         requirement: [
//             {
//                 key: 'p4_path',
//                 value: 'String'
//             },
//             {
//                 key: 'prepare_command',
//                 value: 'String'
//             }


//         ]
//     };
//     describe('post', () => {
//         before((done) => {
//             backgroundModel.remove({}, (err) => { done() });
//         });
//         it('shall give error without specifying name',(done)=>{
//             chai
//                 .request(app)
//                 .post('/api/background')
//                 .send(noname_background)
//                 .end((err, res) => {
//                     res.should.have.status(400);                    
//                     done();
//             });
//         });
//         it('shall give error when no requirement is psecified',(done)=>{
//             chai
//                 .request(app)
//                 .post('/api/background')
//                 .send(norequirement_background)
//                 .end((err, res) => {
//                     res.should.have.status(400);                    
//                     done();
//             });
//         });
//         it('shall create a new background', (done) => {
//             chai
//                 .request(app)
//                 .post('/api/background')
//                 .send(media_farmer)
//                 .end((err, res) => {
//                     res.should.have.status(200);
//                     backgroundModel.where("name")
//                     .equals(media_farmer.name)
//                     .exec((err,query)=>{
//                         query.should.have.property('length').equals(1);
//                         done();
//                     });
                    
//             })
            
//         });


//         it('shall redirect to post when posting against existing background',(done)=>{
//             chai
//             .request(app)
//             .post('/api/background')
//             .send(media_farmer1)
//             .end((err, res) => {
//                 res.should.have.status(200);
                
//                 backgroundModel.where("name")
//                 .equals(media_farmer.name)
//                 .exec((err,query)=>{
//                     query.should.have.property('length').equals(1);
//                     assert.equal(query[0].des,media_farmer1.des);
//                     assert.equal(query[0].qualification[2].task_name,media_farmer1.qualification[2].task_name);
//                     done();
//                 });
                
//             });
//         });

//     });
//     describe('/get', () => {
//         it('shall return all background info when /get only');
//         it('shall shall return selected background info when /get/name')
//     });
//     describe('/post', () => {
//         it('shall not upsert a brand-new backgorund');
//         it('shall update selected registry')
//     });
// });