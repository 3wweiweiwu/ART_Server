var mongoose=require('mongoose'),
    Schema=mongoose.Schema


let projectModel=new Schema({
    _bluePrint:{type:Schema.Types.ObjectId,ref:'Project.Blueprint'},
    pending_tasks:[{
        task_kind:{type:String},
        task:{type:Schema.Types.ObjectId,refPath:'tasks.task_kind'}
    }],
    current_task:{
        task_kind:{type:String},
        task:{type:Schema.Types.ObjectId,refPath:'tasks.task_kind'}
    },
    host:{type:Schema.Types.ObjectId,ref:'Dorm'},
    last_update:{type:Date},
    status:{type:String}
});

module.exports=new mongoose.model("Project",projectModel);