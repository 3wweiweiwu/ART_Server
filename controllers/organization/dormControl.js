var dormModel=require('../../model/organization/dormModel');
var dormValidation=require(('../../validation/dorm.validation.ARTServer'))
let CreateStandardError=require('../common/error.controllers.ARTServer')
const EventEmitter=require('events');

class dormControlEmitterClass extends EventEmitter{};

const dormControlEmitter=new dormControlEmitterClass();

const sPutDormFound="put dorm found";
const sPutDormNotFound="put dorm not found";

function CreateNewDorm(req,res,next)
{
    
    let dorm=new dormModel();
    try{
        dorm.name=req.body.name;
        dorm.system_resource.CPU=req.body.system_resource.CPU;
        dorm.system_resource.total_memory_mb=req.body.system_resource.total_memory_mb;
        dorm.system_resource.free_memory_mb=req.body.system_resource.free_memory_mb;
        dorm.system_resource.disk_total=req.body.system_resource.disk_total;
    }
    catch(ex){
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end();
        return;
    }


    dorm.residents=[];
    dorm.backgrounds=[];
    dorm.save(function (err){
        if(err) {
            console.log(err);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end('ERR');
        }
        else
        {
            res.writeHead(200, {'Content-Type': 'application/json'});
            let result={
                result:"ok"
            };

            let json=JSON.stringify(result);
            res.end(json);

            
        }
    });
}

exports.create=function(req,res,next){
    dormModel.findOne({name:req.body.name},(err,query)=>{
        if(query!=null)
        {
            exports.putDorm(req,res,next);
        }
        else
        {
            CreateNewDorm(req,res,next);
        }
        
    });



    

}
exports.GetDorm=function(name)
{
    return new Promise((resolve,reject)=>{
        dormModel.findOne({name:name})
        .exec((err,res)=>
        {
            if(err)
            {
                reject(CreateStandardError(err,500));
            }
            else
            {
                resolve(res);
            }
        })
    });
}
exports.IsDormValid=function(name){
    return new Promise((resolve,reject)=>{
        exports.GetDorm(name)
        .then((dorm)=>{
            if(dorm==null)
            {
                reject(CreateStandardError('unable to find dorm',400));
            }
            else{
                resolve(dorm);
            }
        })
        .catch((err)=>{
            reject(err);
        })
    });
}

exports.get=function(req,res,next,query){
    let CPU=0;
    let free_memory_mb=0;
    let free_disk_mb=0;

    dormModel
    .find(query)
    .exec((err,query)=>{
        if(err)
        {
            res.end(err);
        }
        else
        {
            output=JSON.stringify(query);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(output);
            
        }
    });

    


    
}

function UpdateDorm(req,res,next,query)
{
    //if query is found, then update the query    


    try{
        name=req.body.name;
        CPU_count=(req.body.system_resource.CPU||query._doc.system_resource.CPU);    
        total_memory=(req.body.system_resource.total_memory_mb||query._doc.system_resource.total_memory_mb);
        free_memory=(req.body.system_resource.free_memory_mb||query._doc.system_resource.free_memory_mb);
        disk_total=req.body.system_resource.disk_total;
    }
    catch(ex)
    {
        res.writeHead(400, {'Content-Type': 'application/json'});
    }

    //handle system resource and last updated
    let updatedObj={
        $set:{'system_resource.CPU':CPU_count,
                'system_resource.total_memory_mb':total_memory,
                'system_resource.free_memory_mb':free_memory,                      
                'last_updated':Date.now()
        }
    };    

    //handle disk_total update
    let index=0;
    // query.system_resource.CPU=CPU_count;
    // query.system_resource.total_memory_mb=total_memory;
    // query.system_resource.free_memory_mb=free_memory;

    query.system_resource.disk_total.forEach(function(element) {
        let result=null;
        let total=null;
        let free=null;
        result=req.body.system_resource.disk_total.filter((item)=>{return item.drive_letter===element.drive_letter})[0];
        if(result==undefined)
        {
            return;
        }

        if(result.total_disk_space_mb!=undefined)
        {
            total=result.total_disk_space_mb;
        }

        if(result.free_disk_space_mb!=undefined)
        {
            free=result.free_disk_space_mb
        }
        let new_disk=total||element.total_disk_space_mb;
        let new_free=free||element.free_disk_space_mb;
        query.system_resource.disk_total[index].total_disk_space_mb=new_disk;
        query.system_resource.disk_total[index].free_disk_space_mb=new_free;
        index++;
    });
    
    req.body.system_resource.disk_total.forEach(function(element) {
        let result=null;
        result=query.system_resource.disk_total.filter((item)=>{return item.drive_letter===element.drive_letter})[0];
        if(result==null)
        {
            query.system_resource.disk_total.push(element);
        }

    });    

    query.save(()=>{
        dormModel.findOneAndUpdate({name:req.body.name},updatedObj,(err,doc)=>{
                
            let result={
                result:"ok",
                dormName:req.body.name

            };
            
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(result));
        });       

    });
    
    

    // let updatedObj={$set:{name:"test"}};


}


exports.putDorm=function(req,res,next){
    
    //if we find the record, then we are going to update the dorm

    
    
    //if we don't have dorm name, then simply output as error
    dormModel.findOne({name:req.body.name},(err,query)=>{
        if(query===null)
        {
            //if no query is found, then return error
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end('{"ERR":"no query match the name '+req.body.name+'"}');            
        }
        else
        {
            //if we find the record, then we are going to update them
            UpdateDorm(req,res,next,query)
            
            
        }
        
    });


    
    



}

