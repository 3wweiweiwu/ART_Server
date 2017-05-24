var mongoose=require('mongoose'),
    Schema=mongoose.Schema,
    mType=Schema.Types;



var visionModel=new Schema({
    name:{type:mongoose.Schema.Types.String},
    director:{type:mType.ObjectId,ref:'Worker'},    
    director_project:{type:mType.ObjectId,ref:'Project'},    
    road_map:[
        {phaseSchema:{type:mType.ObjectId,ref:'Phase'}}
    ],
    status:{type:mongoose.Schema.Types.String}
});

module.exports=mongoose.model('Vision',visionModel);