var mongoose=require('mongoose'),
    Schema=mongoose.Schema


let backGroundSchema=new Schema({
    name:{type:String},
    last_update:{type:Date},
    requirement:[{key:{type:String},value:{type:String}}]
});

backGroundSchema.pre('save',(next)=>{
    this.last_updated=Date.now();
    next();
});
module.exports=mongoose.model("BackGround",backGroundSchema);