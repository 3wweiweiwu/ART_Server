var mongoose=require('mongoose');
let Schema=mongoose.Schema;
let visionModel=require('../../model/vision/vision.model.ARTServer');

let shelfManager=new Schema({
    series:{type:String},
    max_inventory:{type:Number,default:3},
    inventory:[{
        vhd:{type:Schema.Types.ObjectId,ref:'vhd.shelf'}//most likely, we are going to unlink this relationship as it can be useless...
    }],
    subscribers:[{
        vision:{type:Schema.Types.ObjectId,ref:'Vision'},
        last_visited:{type:Date,default:Date.now()}
    }]
});

module.exports=mongoose.model('shelf.Manager',shelfManager);