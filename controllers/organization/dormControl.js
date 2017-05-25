var dormModel=require('../../model/organization/dormModel');
const EventEmitter=require('events');

class dormControlEmitterClass extends EventEmitter{};

const dormControlEmitter=new dormControlEmitterClass();

const sPutDormFound="put dorm found";
const sPutDormNotFound="put dorm not found";

function CreateNewDorm(req,res,next)
{
    var dorm=new dormModel();
    dorm.name=req.body.name;
    dorm.system_resource.CPU=req.body.system_resource.CPU;
    dorm.system_resource.total_memory_mb=req.body.system_resource.total_memory_mb;
    dorm.system_resource.free_memory_mb=req.body.system_resource.free_memory_mb;
    dorm.system_resource.disk_total=req.body.system_resource.disk_total;
    dorm.residents=[];
    dorm.backgrounds=[];
    dorm.save(function (err){
        if(err) {
            console.log(err);
            res.writeHead(401, {'Content-Type': 'application/json'});
            res.end('ERR');
        }
        else
        {
            res.writeHead(200, {'Content-Type': 'application/json'});
            let result={
                result:"dorm is created successfully"
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

exports.get=function(req,res,next){
    let CPU=0;
    let free_memory_mb=0;
    let free_disk_mb=0;
    
    //if there is no parameter, then just list all available dorms with its information
    if(req.url==="/dorm")
    {
        dormModel
        .find({})
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
    
    if(req.body!=null)   
    {
        CPU=req.body.CPU;
        memory_mb=req.body.free_memory_mb;
        free_disk_mb=req.body.free_disk_mb;
    }


    
}

function UpdateDorm(req,res,next,query)
{
    //if query is found, then update the query    
    CPU_count=(req.body.system_resource.CPU||query._doc.system_resource.CPU);
    total_memory=(req.body.system_resource.total_memory_mb||query._doc.system_resource.total_memory_mb);
    free_memory=(req.body.system_resource.free_memory_mb||query._doc.system_resource.free_memory_mb);

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
    query.system_resource.disk_total.forEach(function(element) {
        let result=null;
        result=req.body.system_resource.disk_total.filter((item)=>{return item.drive_letter===element.drive_letter})[0];
        let new_disk=result.total_disk_space_mb||element.total_disk_space_mb
        let new_free=result.free_disk_space_mb||element.free_disk_space_mb
        let key_total="system_resource.disk_total."+index.toString()+"."+"total_disk_space_mb";
        let key_free="system_resource.disk_total."+index.toString()+"."+"free_disk_space_mb";
        updatedObj.$set[key_total]=new_disk;
        updatedObj.$set[key_free]=new_free;
        index++;
    });
    
    req.body.system_resource.disk_total.forEach(function(element) {
        let result=null;
        result=query.system_resource.disk_total.filter((item)=>{return item.drive_letter===element.drive_letter})[0];
        if(result==null)
        {
            index++;
            let new_disk=element.total_disk_space_mb
            let new_free=element.free_disk_space_mb
            let key_total="system_resource.disk_total."+index.toString()+"."+"total_disk_space_mb";
            let key_free="system_resource.disk_total."+index.toString()+"."+"free_disk_space_mb";
            let key_drive="system_resource.disk_total."+index.toString()+"."+"drive_letter";
            updatedObj.$set[key_drive]=element.drive_letter;
            updatedObj.$set[key_total]=new_disk;
            updatedObj.$set[key_free]=new_free;
            index++;
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