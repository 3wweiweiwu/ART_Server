var mongoose=require('mongoose'),
    Schema=mongoose.Schema;

let registrySchema=new Schema({
    vision:{type:String},
    project:{type:String},
    task:{type:String},
    key:{type:String},
    value:{type:String}
});
module.exports=mongoose.model('Registry',registrySchema);