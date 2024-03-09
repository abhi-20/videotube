//import timespan from "jsonwebtoken/lib/timespan";
import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'



const userSchema = new mongoose.Schema({
    username:{
        type : String,
        required : true,
         unique : true,
         lowercase : true,
         index : true,
         trim : true
    },
    
        email:{
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true
        },
        fullname:{
            type : String,
            required : true,
            trim : true,
            index : true
        },
        avatar:{
            type : String, //cloudnary url
            required : true
        },
        coverImage:{
            type : String,
            
        },
        watchHistory:[
            {
                type : Schema.Types.ObjectId,
                ref: "Video",
            }
        ],
        password:{
            type: String,
            required : [true, "Password is required"]
        },
        refreshToken:{
                type: String
            }
        
        

    },{
    timestamps : true
    }
)

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next()       //this function is run before we save our user and when there is a change in password field
                                                        
    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = async function(){
    return jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username,
        fullname : this.fullname
    },
    
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

//access token is short lived; refresh token is long lived. Suppose we logout user after 10 mins for security reasons, so we does not 
//have to write username and password again and again. He just have to hit an api and if the refresh token stored in out database is same 
//as of user's refresh token, he can enter the site and give him a new access token

userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign({
        _id : this._id
    },
    
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFREST_TOKEN_EXPIRY
        }
    )
}

const User = mongoose.model("User",userSchema)

export {User}