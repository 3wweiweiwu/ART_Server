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
    background:{type:mType.ObjectId,ref:'Background'}
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
    backgrounds:[{type:mType.ObjectId,ref:'Background'}],
    registry:[{key:{type:String},value:{type:String}}]
});

dormModel.pre('save',(next)=>{
    this.last_updated=Date.now();
    next();
});

module.exports=mongoose.model("Dorm",dormModel);