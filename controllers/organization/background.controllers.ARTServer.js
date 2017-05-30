// var backgroundModel=require('../../model/organization/background.Model');
// var Promise=require('promise');

// const checkExists=(model,key,value)=>
// {
//     var checkExists=new Promise(function(resolve,reject){
//         model.where(key).equals(value).exec((err,query)=>{
//             if(err) reject(err);
//             else resolve(query);
//         });
//     });

//     return checkExists;
// }

// const CreateNewBackground=(name,des,qualification)=>{
//     var createNew=new Promise((resolve,reject)=>{
//         var background=new backgroundModel();        
//         background.name=name;
//         background.des=des;
        
//         //push qualification into the document
//         qualification.forEach((element)=>{
//             background.qualification.push(element);
//         });
        
//         background.save((err)=>{
//             if(err) reject(err);
//             else resolve("");
//         });
//     });
//     return createNew;
// }

// const UpdateExistingRecord=(requirement,query)=>{    
//     var updatePromise=new Promise((resolve,reject,querObj=query[0],reqs=requirement)=>{
//         console.log();
//         reqs.forEach(function(element) {
//             //filter existing item to find out settings
//             results=querObj.requirement.filter((item)=>{return item.task_name==element.task_name});
//             //if results found, then update current key/value pair
//             //otherwise, just push new into the list
//             if(!results.length)
//             {
//                 querObj.requirement.push(element);
//             }

//         });

//         querObj.save((err)=>{
//             if(err) reject(err);
//             else resolve("");
//         });
//     });
//     return updatePromise;
// }

// const UpdateRecord_Main=(req,res,next)=>
// {
//     checkExists(backgroundModel,'name',req.body.name)
//     .then((query)=>{
        
//         if(query.length===0)
//         {
//             //if no record is found with current name, then return error
//             res.statusMessage='background name is not found';
//             res.end(400);
//         }
//         else
//         {
//             //update the selected record
//             UpdateExistingRecord(req.body.requirement,query)
//             .then(()=>{
                
//                 res.statusMessage='background update successfully';
//                 res.end();
//             });
//         }
//     });
//     res.end(200);
// }

// exports.CreateNew=(req,res,next)=>{
//     //this is api entry point for new background creation
//     var checkNameExists=checkExists(backgroundModel,'name',req.body.name);
//     checkNameExists.then((query)=>{
        
//         if(query.length===0)
//         {
//             //if we cannot find item, then create log
//             CreateNewBackground(req.body.name,req.body.des,req.body.qualification)
//             .then(()=>{
//                 res.writeHead(200);
//                 res.end();
//             });
            
//         }
//         else
//         {
//             //otherwise, just updated the record
//             UpdateRecord_Main(req,res,next);
//         }
//     })

// }

// exports.UpdateRecord=UpdateRecord_Main;
