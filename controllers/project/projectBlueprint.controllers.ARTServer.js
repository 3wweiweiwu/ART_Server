var projectBlueprintModel=require('../../model/project/projectBlueprint.model.ARTServer');
var taskModel=require('../../model/task/task.model.ARTServer.js');
var EventEmitter=require('events');
var async=require('async');

class bluePrintClass extends EventEmitter{};



exports.getBlueprints = function (blueprintQuery,cb=()=>{}) {
    return new Promise((resolve,reject)=>{
        //validate baseblueprint and next blueprint to ensure its validation
        projectBlueprintModel            
            .find(blueprintQuery)
            .exec((err,res)=>{
                if(err)
                {
                    reject(err);
                    return cb(err);
                }
                else{
                    resolve(res);
                    return cb(null,res)
                }
            })
        
    });
}


const newBlueprint=(req,res,next)=>{
    return new Promise((resolve,reject)=>{
        let projectBlueprint=new projectBlueprintModel({
            name:req.body.name,
            note:req.body.note,
            memory_usage_mb:req.body.memory_usage_mb,
            disk_usage_mb:req.body.disk_usage_mb,
            next:req.body.next
        });
        
        let bluePrintEvent=new bluePrintClass()
        let iPusher=0;
        bluePrintEvent.on('projectBlueprintPush',()=>{
            iPusher++;
            if(iPusher>=req.body.tasks.length)
            {
                projectBlueprint.save();
                resolve();
            }
        })
        //After task list and project linking are done, then save model
        let iTotalLinking=req.body.tasks.length;    
        if(iTotalLinking===0)
        {
            //if there is no task and next associate with this project, then just save it
            bluePrintEvent.emit('projectBlueprintPush');
        }
        else
        {
            //look up task list and link task to memory usage

            for(i=0;i<req.body.tasks.length;i++){
                
                let currentTaskname=req.body.tasks[i];
                taskModel.findOne({name:currentTaskname})
                .exec((err,task)=>{
                    if(task==null) reject("Unable to find Task "+currentTaskname)
                    else{
                        projectBlueprint.tasks.push({task:task._id});
                        bluePrintEvent.emit('projectBlueprintPush')
                    }
                    
                });
            }



        }

    });



}

exports.queryBlueprint=function(blueprint,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        projectBlueprintModel.findOne({name:blueprint})
        .exec((err,query)=>{
            if(err){
                let result={
                    status:500,
                    err:err
                }
                reject(result);
                return cb({result});
            }
            else{
                resolve(query)
                return cb(null,query);
            }
        });
    });
}
exports.createBlueprint=(req,res,next)=>{
    projectBlueprintModel.remove({name:req.body.name},(err,query)=>{
        newBlueprint(req,res,next)
        .then(()=>{res.json();})
        .catch((err)=>{
            res.status(400).json({
                result:'fail',
                detail:err
            });
        });
    });
}

exports.getBlueprint=(req,res,next,query)=>{
    projectBlueprintModel.find(query)
    .exec((err,query)=>{
        res.json(query);
    });
}
