module.exports=function (err, statusCode = 400, res = {}) {
    if(err.status!=undefined){
        statusCode=err.status;
    }
    
    return {
        result: err,
        status: statusCode,
        err: err,
        res: res

    };
};