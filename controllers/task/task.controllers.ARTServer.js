var taskModel=require('../../model/task/task.model.ARTServer.js');
var taskImageDeploy=require('../../model/task/imageDeploy.model.ARTServer.js');
let StandardError=require('../common/error.controllers.ARTServer')
let taskControl=function(){
    let CreateNewTask=(req,res,next)=>{
        
        
        return new Promise((resolve,reject)=>{
            let task=new taskModel({
                name:req.body.name,
                note:req.body.note,
                task_script_path:req.body.task_script_path,
                
                
                
            });
            //depends on type setting, we decide what kind of document it is
            if(req.body.setting_type==='NULL'){
                //if there is no setting type, then we just ignore it
                task.save((err)=>{
                    if(err) console.log(err);
                    resolve();
                });
            }
            else if(req.body.setting_type==="Task.ImageDeploy"){
                //if it is Task.ImageDeploy, then 
                let imageDeploy=new taskImageDeploy({
                    memory_size_mb:req.body.memory_size_mb,
                    CPU_Core:req.body.CPU_Core,
                    remote_vhd_path:req.body.remote_vhd_path
                });

                imageDeploy.save((err)=>{
                    task._settings=imageDeploy._id;
                    task.setting_type=req.body.setting_type;
                    task.save((err)=>{
                        if(err) console.log(err);
                        resolve();
                    });    
                });
            }
        });


        

    }

    let create=function(req,res,next){
        taskModel.findOne({name:req.body.name},(err,query)=>{
            
            //delete duplicate record
            if(query!=null)
            {
                taskModel.remove({name:req.body.name}, (err) => { 
                    taskImageDeploy.remove({_id:query._settings},(err)=>{                    
                    })
                    
                });            
            }
            
            
            CreateNewTask(req,res,next)
            .then(()=>{
                res.writeHead(200);
                res.end();
            })
            
            
        });
    }

  
    let isTaskValid=function(taskName){
        return new Promise((resolve,reject)=>{
            taskModel.findOne({name:taskName})
                .then(task=>{
                    if(task==null){
                        reject(StandardError('unable to find task specified',500))
                        return
                    }
                    else{
                        resolve(task);
                    }
                    
                })
                .catch(err=>{
                    reject(err);
                })
        });

    }
    

    let get=function(req,res,next,searchCriteria){
        
        //
        taskModel.find(searchCriteria)    
        .populate('_settings')
        .exec((err,query)=>{
            if(err)
                res.send(err);
            res.json(query);
        })

        
    }

    return {
        create:create,
        isTaskValid:isTaskValid,
        get:get
    }

}

module.exports=taskControl();

// const CreateNewTask=(req,res,next)=>{
    
    
//     return new Promise((resolve,reject)=>{
//         let task=new taskModel({
//             name:req.body.name,
//             note:req.body.note,
//             task_script_path:req.body.task_script_path,
            
            
            
//         });
//         //depends on type setting, we decide what kind of document it is
//         if(req.body.setting_type==='NULL'){
//             //if there is no setting type, then we just ignore it
//             task.save((err)=>{
//                 if(err) console.log(err);
//                 resolve();
//             });
//         }
//         else if(req.body.setting_type==="Task.ImageDeploy"){
//             //if it is Task.ImageDeploy, then 
//             let imageDeploy=new taskImageDeploy({
//                 memory_size_mb:req.body.memory_size_mb,
//                 CPU_Core:req.body.CPU_Core,
//                 remote_vhd_path:req.body.remote_vhd_path
//             });

//             imageDeploy.save((err)=>{
//                 task._settings=imageDeploy._id;
//                 task.setting_type=req.body.setting_type;
//                 task.save((err)=>{
//                     if(err) console.log(err);
//                     resolve();
//                 });    
//             });
//         }
//     });


       

// }



// exports.create=function(req,res,next){
//     taskModel.findOne({name:req.body.name},(err,query)=>{
        
//         //delete duplicate record
//         if(query!=null)
//         {
//             taskModel.remove({name:req.body.name}, (err) => { 
//                 taskImageDeploy.remove({_id:query._settings},(err)=>{                    
//                 })
                
//             });            
//         }
        
        
//         CreateNewTask(req,res,next)
//         .then(()=>{
//             res.writeHead(200);
//             res.end();
//         })
        
        
//     });
// }

// exports.isTaskValid=function(taskName){
//     return new Promise((resolve,reject)=>{
//         taskModel.findOne({name:taskName})
//             .then(task=>{
//                 if(task==null){
//                     reject(StandardError('unable to find task specified',500))
//                     return
//                 }
//                 else{
//                     resolve(task);
//                 }
                
//             })
//             .catch(err=>{
//                 reject(err);
//             })
//     });

// }

// exports.get=function(req,res,next,searchCriteria){
    
//     //
//     taskModel.find(searchCriteria)    
//     .populate('_settings')
//     .exec((err,query)=>{
//         if(err)
//             res.send(err);
//         res.json(query);
//     })

    
// }
