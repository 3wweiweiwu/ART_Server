var mongoose=require('mongoose'),
    Schema=mongoose.Schema


let projectMinModel=new Schema({
    name:{type:String,required:true},
    note:{type:String},
    memory_usage_mb:{type:Number},
    disk_usage_mb:{type:Number},
    tasks:[{        
        task:{type:Schema.Types.ObjectId,ref:'Task'}
    }],
    next:[
        {name:{type:String}}
    ]
});

module.exports=mongoose.model("Project.Blueprint",projectMinModel);