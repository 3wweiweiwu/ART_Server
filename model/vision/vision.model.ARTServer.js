var mongoose=require('mongoose'),
    Schema=mongoose.Schema;
    



var visionModel=new Schema({
    name:{type:String},
    note:{type:String},
    key_projects:[{
        project_blueprint:{type:Schema.Types.ObjectId,ref:'Project.Blueprint'}
    }],    
    current_projects:[{
        _project:{type:Schema.Types.ObjectId,ref:'Project'}
    }],
    status:{type:String},
    history:[{info:String}],
    registry:[{
        key:{type:String},
        value:{type:String}
    }],
    info:{
        project_schedule:[{
            vid_group_info:{
                project_blueprint:{type:Schema.Types.ObjectId,ref:'Project.Blueprint'},                
                current_group_number:{type:Number}
            }
        }]
    },
    project_schedule:[{
        project_blueprint:{type:Schema.Types.ObjectId,ref:'Project.Blueprint'},
        server_ask:{type:Number},
        machine_demand:[{
            dorm:{type:Schema.Types.ObjectId,ref:'Dorm'},
            instance:{type:Number},
            vid_list:[{
                vid:String,
                group_number:Number
            }]
            
        }],
        next_project:[
            {blueprint:{type:Schema.Types.ObjectId,ref:'Project.Blueprint'}}
        ]
    }]
});

module.exports=mongoose.model('Vision',visionModel);