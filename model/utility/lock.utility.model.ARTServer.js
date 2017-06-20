var mongoose=require('mongoose'),
    Schema=mongoose.Schema;
//lock object will expire after 30s
let lockModel=new Schema({
    name:{type:String},
    createdAt: { type: Date, default:Date.now}
});

lockModel.index({ createdAt: 1 }, { expireAfterSeconds: 30 });


module.exports=mongoose.model('Lock',lockModel);