const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const JWTD = require("jwt-decode");
const secret = "a0990jd90wfhw084wh";
const hashing = async(value)=>{
    try {    
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(value,salt);
        return hash;
    } catch (error) {
        return error;
    }
}
const createJWT = async({email})=>{
    return await JWT.sign(
        {
            email
        },
        secret,
        {
            expiresIn:"24h"
        }
    )
}
const hashCompare = async(password,hashValue)=>{
    try {
        return await bcrypt.compare(password,hashValue)
    } catch (error) {
        return error;
    }
}
const authenticate = async(token)=>{
    const decode = JWTD(token);
    return decode.email;
}
module.exports={hashing,createJWT,authenticate,hashCompare};