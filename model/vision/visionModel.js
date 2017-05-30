var mongoose=require('mongoose'),
    Schema=mongoose.Schema,
    mType=Schema.Types;



var visionModel=new Schema({
    name:{type:mongoose.Schema.Types.String},
    director:{type:mType.ObjectId,ref:'Worker'},    
    director_project:{type:mType.ObjectId,ref:'Project'},    
    projects:[{
        _project:{type:Schema.Types.ObjectId,ref:'Project'}
    }],
    watch_projects:[{
        _project:{type:Schema.Types.ObjectId,ref:'Project'}
    }],
    status:{type:String},
    history:[{info:String}],
    note:[{
        key:{type:String},
        value:{type:String}
    }]
});

module.exports=mongoose.model('Vision',visionModel);