module.exports=function (err, statusCode = 400, res = {}) {
    return {
        result: err,
        status: statusCode,
        err: err,
        res: res

    }
}