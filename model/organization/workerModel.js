var mongoose=require('mongoose'),
    Schema=mongoose.Schema,
    mType=Schema.Types;



var workerModel=new Schema({
    name:{type:mType.String},
    vision:{type:mType.ObjectId,ref:'Vision'},
    strategy:{type:mType.ObjectId,ref:'Strategy'},
    project:{type:mType.ObjectId,ref:'Project'},
    dorm:{type:mType.ObjectId,ref:'Dorm'},    
    last_response:{type:mType.Date},
    pending_phases:[{phase:{type:mType.ObjectId}}]    
});

module.exports=mongoose.model("Worker",workerModel)