var mongoose=require('mongoose'),
    Schema=mongoose.Schema,
    mType=Schema.Types;

var jobDescriptionSchema=new Schema({
    description:{
            key:{type:mType.String},
            value:{type:mType.String}
        }    
});

var projectModel=new Schema({    
    roles:[{role:{type:mType.ObjectId,ref:"Role"}}],
    job_descriptions:[jobDescriptionSchema],
    task_pending:[{task:{type:mType.ObjectId,ref:'Task'}}],
    active_task:{type:mType.ObjectId,ref:'Task'},
    worker:{type:mType.ObjectId,ref:'Worker'}
});



module.exports=mongoose("Project",projectModel)