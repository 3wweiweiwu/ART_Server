let expressValidator=require('express-validator');
let validator=require('validator')
const isDormDiskValid=(values)=>{
    return values.every((val)=>{
        return !validator.isEmpty(val.drive_letter)&&val.total_memory_mb&&typeof(val.total_memory_mb)=='number'&&typeof(val.free_memory_mb)=='number'&&typeof(val.free_disk_space_mb)=='number'
    });

}

exports.postValidation=(req,res,next,cb=(req,res,next)=>{})=>{
    //req.assert('name','required').notEmpty();
    req.checkBody('name','required').notEmpty();
    req.checkBody('system_resource.CPU','CPU usage must be a int').isInt();
    req.checkBody('system_resource.total_memory_mb','total_memory_mb must be a int').notEmpty().isInt();

    

    req.getValidationResult().then((result)=>{
        if(!result.isEmpty())
        {
            res.status(400).json(result.array());
        }
        else if(!isDormDiskValid(req.body.system_resource.disk_total)){
            res.status(400).json('invalid disk info')
        }
        else
        {
            cb(req,res,next)
        }
    });
}