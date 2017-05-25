var backgroundModel=require('../../model/organization/background.Model');
var Promise=require('promise');

const checkExists=(name)=>
{
    var checkExists=new Promise(function(resolve,reject){
        backgroundModel.where('name').equals(name).exec((err,query)=>{
            if(err) reject(err);
            else resolve(query);
        });
    });

    return checkExists;
}

const CreateNewBackground=(name,requirement)=>{
    var createNew=new Promise((resolve,reject)=>{
        var background=new backgroundModel();        
        background.name=name;
        background.requirement=requirement;
        background.save((err)=>{
            if(err) reject(err);
            else resolve("");
        });
    });
    return createNew;
}

exports.CreateNew=(req,res,next)=>{
    //this is api entry point for new background creation


    var checkNameExists=checkExists(req.body.name);
    checkNameExists.then((query)=>{
        console.log(query);
        if(query.length===0)
        {
            //if we cannot find item, then create log
            CreateNewBackground(req.body.name,req.body.requirement)
            .then(()=>{
                res.writeHead(200);
                res.end();
            });
            
        }
        else
        {
            //otherwise, just updated the record
            UpdateRecord(req,res,next);
        }
    })




    // background.Save((err)=>{
    //     if(err){            
    //         console.log(err);
    //         res.writeHead(500, {'Content-Type': 'application/json'});
    //         json={result:'error',info:'unable to create new background'};
    //         res.end(JSON.stringify(json));
    //     }
    //     else
    //     {
    //         res.writeHead(200, {'Content-Type': 'application/json'});
    //         let result={
    //             result:"success"
    //         };

    //         let json=JSON.stringify(result);
    //         res.end(json);
    //     }

    // });
}

exports.UpdateRecord=(req,res,next)=>{
    res.end(200);
}
