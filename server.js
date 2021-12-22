const mongoose = require('mongoose')
const dotenv = require('dotenv')

process.on('unhandledRejection', err => {
    console.log("UNHANDLED REJECTION! , Shutting down...")
    console.log(err.message)
    process.exit(1)
})

dotenv.config({path: './config.env'})

const app = require('./app')
const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD)

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true 
}).then(con => {(
    console.log("Connection to DB Established...!") 
)})


const port = process.env.PORT || 3000
const server = app.listen(port, () => {
    console.log(`Listening on Port ${port}`)
}) 

process.on('uncaughtException', err=> {
    console.log("UNCAUGHT EXCEPTION! , Shutting down...")
    console.log(err.name, err.message)
    server.close(() => { // Shutting down gracefully
        process.exit(1)
    })
})

// console.log(x)
 
