var mongoose=require('mongoose'),
    Schema=mongoose.Schema,
    mType=Schema.Types;

var configSchema=new Schema({
    key:{type:mType.String},
    value:{type:mType.String}
});

var task_schema=new Schema({
    name:{type:mType.String},
    plan:{type:mType.String},
    error:{type:mType.String},
    config:[configSchema]
});

module.exports=mongoose.model('Task',task_schema);