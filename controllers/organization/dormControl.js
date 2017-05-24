var dormModel=require('../../model/organization/dormModel');

exports.create=function(req,res,next){
    dormModel.findOne({name:req.body.name},(err,query)=>{
        if(query!=null)
        {
            exports.putDorm(req,res,next);
        }
        
    });



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

exports.putDorm=function(req,res,next){
    
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
            //if query is found, then update the query
            
            CPU_count=(req.body.system_resource.CPU||query._doc.system_resource.CPU);
            total_memory=(req.body.system_resource.total_memory_mb||query._doc.system_resource.total_memory_mb);
            free_memory=(req.body.system_resource.free_memory_mb||query._doc.system_resource.free_memory_mb);
            let updatedObj={
                $set:{
                    system_resource:{
                        CPU:CPU_count,
                        total_memory_mb:total_memory,
                        free_memory_mb:free_memory
                    }
                }
            };




            // let updatedObj={$set:{name:"test"}};

            dormModel.findOneAndUpdate({name:req.body.name},updatedObj,(err,doc)=>{
                    console.log(doc);
                    let result={
                        result:"ok",
                        dormName:req.body.name
                    };
                    
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify(result));
                });
            

        }
        
    });
    
    
    // var dorm=new dormModel();
    // dorm.name=req.body.name;
    // dorm.system_resource.CPU=req.body.system_resource.CPU;
    // dorm.system_resource.total_memory_mb=req.body.system_resource.total_memory_mb;
    // dorm.system_resource.free_memory_mb=req.body.system_resource.free_memory_mb;
    // dorm.system_resource.disk_total=req.body.system_resource.disk_total;
    // dorm.residents=[];
    // dorm.backgrounds=[];


}