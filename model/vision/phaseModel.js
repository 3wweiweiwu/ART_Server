var mongoose=require('mongoose'),
    Schema=mongoose.Schema,
    mType=Schema.Types;



var nextProjectSchema

var phaseSchema=new Schema(
    {   
        vision:{type:mType.ObjectId,ref:"Vision"},
        project:{type:mType.ObjectId,ref:'Project'},
        next_phases:[{phase:{type:mType.ObjectId,ref:'Phase'}}]       
    }
);



module.exports=mongoose("Phase",phaseSchema)