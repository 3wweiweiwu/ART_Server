var mongoose=require('mongoose'),
    Schema=mongoose.Schema;

let registrySchema=new Schema({
    vision:{type:Schema.Types.ObjectId,ref:'Vision'},
    project:{type:Schema.Types.ObjectId,ref:'Project'},
    task:{type:Schema.Types.ObjectId,ref:'Task'},
    key:{type:String},
    value:{type:String}
});