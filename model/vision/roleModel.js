var mongoose=require('mongoose'),
    Schema=mongoose.Schema,
    mType=Schema.Types;

var roleModel=new Schema({
    name:{type:mType.String},
    road_map:[{
        task:{
            type:mType.ObjectId,
            ref:"Task"
        }
    }],
    required_resource:{
        CPU:number,
        memory_mb:number,
        disk_mb:number
    },
    required_background:{type:mType.String}
});

module.exports=new mongoose.model("Role",roleModel);