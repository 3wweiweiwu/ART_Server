process.env.NODE_ENV = 'test';
var assert = require('assert');

let vhdSupport=require('./support.vhd.shelf.controllers.ARTServer');
let config=require('../../config')

let vhdModel=require('../../model/shelf/vhd.shelf.model.ARTServer')
var visionModel = require('../../model/vision/vision.model.ARTServer.js');
var taskModel = require('../../model/task/task.model.ARTServer');
var projectBlueprintModel = require('../../model/project/projectBlueprint.model.ARTServer');
var projectModel = require('../../model/project/project.model.ARTServer');
let dormModel = require('../../model/organization/dormModel');
var taskImageDeployment = require('../../model/task/imageDeploy.model.ARTServer');


describe('get /shelf/vhd',()=>{
    it('shall return all possible vhd in the shelf');
});

describe('get /shelf/vhd/download/:id',()=>{
    it('shall download the vhd with specified id');
    it('shall return error 400 when id is invalid or incorrect');
});