var mongoose=require('mongoose'),
    Schema=mongoose.Schema,
    mType=Schema.Types;


var report_item=new Schema({
        from:{type:mType.String},
        to:{type:mType.String},
        created_at:{type:mType.Date,default:Date.now},
        class:{type:mType.String},
        info:{type:mType.String}
    });

var request_item=new Schema({
            from:{type:mType.String},
            to:{type:mType.String},
            created_at:{type:mType.Date,default:Date.now},
            class:{type:mType.String},
            info:{type:mType.String},
            status:{type:mType.String}
        });
var registy_item=new Schema({
        from:{type:mType.String},
        to:{type:mType.String},
        created_at:{type:mType.Date,default:Date.now},
        key:{type:mType.String},
        value:{type:mType.String}
});
var direct_report_item=new Schema(
    {
        manager:{
            type:mType.ObjectId,
            ref:'Manager',                    
        },
        required_direct_report_number:{type:mType.Number}
    }
);



var strategyModel=new Schema({
    vision:{
        type:mType.ObjectId,
        ref:'Vision'
    },
    reports:[
        report_item        
    ],
    request:[
        request_item
    ],
    created_at:{type:mType.Date,default:Date.now},       
    registy:[{
        registy_item
    }],
    manager:{type:mType.ObjectId,ref:'Worker'},
    manager_project:{type:mType.ObjectId,ref:'Project'},
    pending_phases:[{phase:{type:mType.ObjectId,ref:'Phase'}}],
    current_phase:{type:mType.ObjectId,ref:'Phase'},
    load_distribution:[{
        worker:{type:mType.ObjectId,ref:'Worker'},
        project:{type:mType.ObjectId,ref:"Project"}
    }]
});

module.exports=mongoose.model('Strategy',strategyModel);