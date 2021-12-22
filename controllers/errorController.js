const AppError = require('./../utils/appError')

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`
    return new AppError(message, 400)
}

const handleDuplicateFieldsDB = err => {
    const message = `Duplicate field value: ${err.keyValue.name}. Please use another value`
    return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message)

    const message = `Invalid input data. ${errors.join('. ')}`
    return new AppError(message, 400)
}

const handleJWTError = () => {
    return new AppError('Invalid token, Please login again', 401)
}

const handleJWTExpiredError = () => {
    return new AppError('Your token has expired, Please login again', 401)
}

const sendDevError = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

const sendProdError = (err, res) => {
    // Operational Error will be sent to client
    if (err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } 

    // Programming / Unknown Error will not be leaked
    else {
        // for developers to figure out what was the error:-
        console.error('ERROR: ',err)

        // just for the client to make him/her aware
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        })
    }
}

// Global Error Middleware Controller
module.exports = (err, req, res, next) => {

    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'

    if (process.env.NODE_ENV === "development") {
        sendDevError(err,res)

    } else if (process.env.NODE_ENV === "production") {
        let error = {...err, name: err.name, message: err.message}
        // console.log(err)

        if(error.name==='CastError') {
            error = handleCastErrorDB(error)
        }

        if(error.code === 11000) {
            error = handleDuplicateFieldsDB(error)
        }

        if(error.name === 'ValidationError') {
            console.log(error)
            error = handleValidationErrorDB(error)
        }

        if(error.name === 'JsonWebTokenError') {
            error = handleJWTError()
        }

        if(error.name === 'TokenExpiredError') {
            error = handleJWTExpiredError()
        }
        sendProdError(error,res)
    }
}
