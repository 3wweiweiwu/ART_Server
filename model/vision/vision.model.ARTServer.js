var mongoose=require('mongoose'),
    Schema=mongoose.Schema,
    mType=Schema.Types;



var visionModel=new Schema({
    name:{type:String},
    note:{type:String},
    key_projects:[{
        project_blueprint:{type:Schema.Types.ObjectId,ref:'Project.Blueprint'}
    }],    
    current_projects:[{
        _project:{type:Schema.Types.ObjectId,ref:'Project'}
    }],
    status:{type:String},
    history:[{info:String}],
    registry:[{
        key:{type:String},
        value:{type:String}
    }]
});

module.exports=mongoose.model('Vision',visionModel);