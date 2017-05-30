var mongoose=require('mongoose'),
    Schema=mongoose.Schema


let projectMinModel=new Schema({
    name:{type:String,required:true},
    note:{type:String,required:true},
    memory_usage_mb:{type:Number,required:true},
    disk_usage_mb:{type:Number,required:true},
    tasks:[{
        task_kind:{type:String},
        task:{type:Schema.Types.ObjectId,refPath:'tasks.task_kind'}
    }],
    next:[
        {_project:Schema.Types.ObjectId,ref:'Project.Blueprint'}
    ]
});

module.exports=new mongoose.model("Project.Blueprint")