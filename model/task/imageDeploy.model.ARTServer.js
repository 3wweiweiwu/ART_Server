var mongoose=require('mongoose'),
    Schema=mongoose.Schema

let imageDeployTaskModel=new Schema({
    memory_size_mb:{type:Number},
    CPU_Core:{type:Number},    
    remote_vhd_path:{type:String,required:true}    
});

module.exports=mongoose.model('Task.ImageDeploy',imageDeployTaskModel);