import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
import * as dotenv from "dotenv";

dotenv.config()
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (locatFilePath) =>{
    try {
        if(!locatFilePath) return null
          //upload file on cloudinary
        const response = await cloudinary.uploader.upload(locatFilePath,{
            resource_type: "auto"
        })

        //file uploaded successfully
        console.log(("file uploaded successfully", response.url));

        fs.unlinkSync(locatFilePath)

        return response
    } catch (error) {
        fs.unlinkSync(locatFilePath)//remove locally saved temp file as upload operation got failed
        return null
    }
}

export {uploadOnCloudinary}