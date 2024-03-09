import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';
//import fileUpload from 'express-fileupload';

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended:true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
//app.use(fileUpload({useTempFiles: true}))


//routes import
import userRouter from './routes/user.routes.js'

//route declaration
app.use("/api/v1/users",userRouter)

export {app}