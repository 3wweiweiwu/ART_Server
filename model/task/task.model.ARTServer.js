var mongoose=require('mongoose'),
    Schema=mongoose.Schema



let imageDeployTask=new Schema({
    name:{type:String,required:true},
    note:{type:String},    
    task_script_path:{type:String},
    
    setting_type:{type:String},
    
    _settings:{type:Schema.Types.ObjectId,refPath:'setting_type'}
    
    
});



imageDeployTask.pre('save',(next)=>{
    //this.last_update=Date.now();
    next();
});
module.exports=mongoose.model('Task',imageDeployTask);