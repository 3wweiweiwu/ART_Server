var mongoose=require('mongoose'),
    Schema=mongoose.Schema


let projectModel=new Schema({
    _bluePrint:{type:Schema.Types.ObjectId,ref:'Project.Blueprint'},
    pending_tasks:[{        
        task:{type:Schema.Types.ObjectId,ref:'Task'}
    }],
    host:{type:Schema.Types.ObjectId,ref:'Dorm'},
    host_id:{type:String},
    last_update:{type:Date},
    status:{type:String}
});

projectModel.pre('save',(next)=>{
    this.last_update=Date.now();
    next();
})

module.exports=mongoose.model("Project",projectModel);