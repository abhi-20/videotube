import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken =  user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //save our refresh token in our database
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false}) // validateBeforeSave because mongoose has a feature that whenever you save, it re-runs
        //everything so it will as k you password again. So validateBeforeSave means save without validation

        return {accessToken, refreshToken}
          


    } catch (error) {
        throw new ApiError(500,"something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req,res)=>{
    const {username, email,fullname, password } = req.body
   // console.log("full name:", fullname);

    if(fullname === ""){
        throw new ApiError(400, "full name is required")
    }

    if(email === ""){
        throw new ApiError(400, "email is required")
    }

    if(username === ""){
        throw new ApiError(400, "username is required")
    }

    if(password === ""){
        throw new ApiError(400, "password is required")
    }

    //check if user with that username or email already exist
   const existedUser = await User.findOne({
    $or : [{email},{username}]
   })

   if(existedUser){
    throw new ApiError(409, "User already exist")
   }

   //as express gives us req.body, so the multer has given us some more access in req.files
   const avatarLocalPath =  req.files?.avatar[0]?.path;
   //const coverImageLocalPath = req.files?.coverImage[0]?.path

   let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

   if(!avatarLocalPath){
    throw new ApiError(400, "Avatar is required")
   }


   const avatar =  await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar){
    throw new ApiError(400, "Avatar is required. not uploaded to cloudinary")
   }



   const user = await User.create({
    username,
    email,
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    password,
   })

   const createdUser = await User.findById(user._id).select("-password -refreshToken")

   if(!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
   }


   return res.status(201).json(
    new ApiResponse(200, createdUser,  "user registered successfully!")
   )

})

//steps for user creation
//step 1 -- get user details from frontend
//step 2 -- validation check if we have got required fields or not
//step 3 -- check if user already exist(username or email)
//step 4 -- check for avatar and images and upload them to cloudinary
//step 5 -- create user object to send it to db
//step 6 -- remove password and refresh token from response
//step 7 -- check for user creation
//step 8 -- send response


const loginUser = asyncHandler(async (req,res)=>{
    const {username, email, password} = req.body

    if(!(username || email)){
        throw new ApiError(400, "email or username is required")
    }

    const user =  await User.findOne({
        $or :[{username},{email}]
    })

    if(!user) {
        throw new ApiError(404, "user does not exist")
    }

    const passwordVerified =  await user.isPasswordCorrect(password)

    if(!passwordVerified){
        throw new ApiError(401,"password is incorrect")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,              //this is so that our cookie is not editable from frontend side and can only be edited from 
        secure : true                //server side
    }

    console.log(accessToken);
    console.log(refreshToken);

    return res
    .status(200)
    .cookie("accessToken" , accessToken,options)
    .cookie("refreshToken" , refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )

   


})

//steps for login user
//step 1 -- 


const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{refreshToken:null}
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly : true,              //this is so that our cookie is not editable from frontend side and can only be edited from 
        secure : true                //server side
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged out successfully"))

})

export {registerUser, loginUser, logoutUser}



