var mongoose=require('mongoose'),
    Schema=mongoose.Schema;
//lock object will expire after 30s
let lockModel=new Schema({
    name:{type:String},
    createdAt: { type: Date, expires: 60*60*60,default:Date.now()}
});

module.exports=mongoose.model('Lock',lockModel);