var mongoose=require('mongoose');
let Schema=mongoose.Schema;

let vhdModel=new Schema({
    created:{
        By:{type:String},
        at:{type:Date,default:Date.now()},
        intro:{type:String},
        is_testing:{type:Boolean,default:false}    
    },
    content:{        
        os:{type:String},
        series:{type:String},
        installed_products:[{
            name:{type:String},
            version:{type:String},
            build:{type:String}
        }],
        installed_media:{
            name:{type:String}
        },
        is_keeper:{type:Boolean}
    },
    storage:{        
        destination:{type:String},
        encoding:{type:String},
        filename:{type:String},        
        mimetype:{type:String},
        originalname:{type:String},
        path:{type:String},
        size:{type:Number},
        username:{type:String},
        password:{type:String}
    }

});
module.exports=mongoose.model('vhd.shelf',vhdModel);