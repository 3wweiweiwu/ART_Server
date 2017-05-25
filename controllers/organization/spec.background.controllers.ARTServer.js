process.env.NODE_ENV = 'test';
let async = require('async');
const EventEmitter = require('events');
let app = require('../../app.js');
var assert = require('assert');
var backgroundModel = require('../../model/organization/background.Model.js');

let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
chai.use(chaiHttp);

describe('background', () => {
    let media_farmer = {
        name: "aes_media_farmer",
        requirement: [
            {
                key: 'media_post_folder',
                value: 'String'
            },
            {
                key: 'prodcut_family',
                value: 'String'
            }
        ]
    };
    let noname_background={
        requirement:[]
    }
    let norequirement_background = {
        name: "scm_test_runner"
    };
    let mvt_runner_2 = {
        name: "scm_test_runner",
        requirement: [
            {
                key: 'p4_path',
                value: 'String'
            },
            {
                key: 'prepare_command',
                value: 'String'
            }


        ]
    };
    describe('post', () => {
        before((done) => {
            backgroundModel.remove({}, (err) => { done() });
        });
        it('shall give error without specifying name',(done)=>{
            chai
                .request(app)
                .post('/api/background')
                .send(noname_background)
                .end((err, res) => {
                    res.should.have.status(400);                    
                    done();
            });
        });
        it('shall give error when no requirement is psecified',(done)=>{
            chai
                .request(app)
                .post('/api/background')
                .send(norequirement_background)
                .end((err, res) => {
                    res.should.have.status(400);                    
                    done();
            });
        });
        it('shall create a new background for machine', (done) => {
            chai
                .request(app)
                .post('/api/background')
                .send(media_farmer)
                .end((err, res) => {
                    res.should.have.status(200);
                    
                    done();
            })
            
        });


        it('shall redirect to post when posting against existing background')
    });
    describe('/get', () => {
        it('shall return all background info when /get only');
        it('shall shall return selected background info when /get/name')
    });
    describe('/post', () => {
        it('shall not upsert a brand-new backgorund');
        it('shall update selected registry')
    });
});