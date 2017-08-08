var mongoose=require('mongoose'),
    Schema=mongoose.Schema,
    mType=Schema.Types;

var diskSchema=new Schema({
    drive_letter:{type:String},
    total_disk_space_mb:{type:Number},  
    free_disk_space_mb:{type:Number}
});

var registrySchema=new Schema({
    key:{type:String},
    value:{type:String},
    vision:{type:mType.ObjectId,ref:'Vision'}
});

var dormModel=new Schema({
    name:{type:String},
    system_resource:{
        CPU:{type:Number},
        total_memory_mb:{type:Number},
        free_memory_mb:{type:Number},
        disk_total:[diskSchema]
    },
    last_updated:{type:Date,default:Date.now()},
    residents:[{worker:{type:mType.ObjectId,ref:'Worker'}}],
    vision:[{type:mType.ObjectId,ref:'Vision'}],
    registry:[{key:{type:String},value:{type:String}}],
    running_project:[{key:{type:Schema.Types.ObjectId,ref:'Project'}}],
    pending_project:[{key:{type:Schema.Types.ObjectId,ref:'Project'}}],
    current_task:{type:Schema.Types.ObjectId,ref:'Task'}
});

dormModel.pre('save',(next)=>{
    this.last_updated=Date.now();
    next();
});

module.exports=mongoose.model("Dorm",dormModel);