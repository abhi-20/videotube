import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";



const verifyJWT = asyncHandler(async (req,_,next)=>{
    try {
        const token = req.cookies?.accessToken
        console.log(token);
    
        if(!token){
            throw new ApiError(401,"unauthorized request")
        }
    
        const decodedToken =  await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(401,"invalid access token")
        }
    
        //creating a new object which has user data which can be used anywhere jist like "req.body"
        req.user = user

        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "invalid access token")
    }
})

export default verifyJWT