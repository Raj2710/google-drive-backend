var express = require('express');
var router = express.Router();
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const{dbUrl,mongodb,MongoClient}=require("../dbConfig");
const{hashing, createJWT,authenticate,hashCompare}=require("../library/auth");
const{sender,pwd}=require("../library/config");
const { compileClient } = require('jade');
router.post("/register",async(req,res)=>{
  const client = await MongoClient.connect(dbUrl);
  try {
    const db = client.db("GDrive");
    let user = await db.collection("user").findOne({email:req.body.email});
    if(user){
      res.status(400).json({//if user exist
        message:"User already exists"
      })
    }
    else{
      const hash = await hashing(req.body.password);//hash the pwd
      req.body.password = hash;
      const document = await db.collection("user").insertOne(req.body);
      const token = await createJWT({//token generation
        email:req.body.email
      })
      const transport = await nodemailer.createTransport({//create transport
        service:"Gmail",//service provider
        auth:{
          user:sender,
          pass:pwd
        }
      })
      const sendConfirmationEmail = await transport.sendMail({//sending mail with activation link
        from:sender,
        to:req.body.email,
        subject:"Account Activation",
        html:`<h1>Email Confirmation</h1>
        <h2>Hello ${req.body.firstName}</h2>
        <p>You are one step away to store your valuable data. Please confirm your email by clicking on the following link</p>
        <a href=http://localhost:3000/users/confirm/${token}> Click here</a>
        </div>`
      })
      res.status(200).json({
        message:"Acount created",
        instruction:"Check your mail inbox to activate the account"
      })
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
  finally{
    client.close();
  }
})

router.get("/confirm/:token",async(req,res)=>{//account activation from the link from  mail
  const client = await MongoClient.connect(dbUrl);
  const token = req.params.token;
  const mail = await authenticate(token);//authenticating the token and decoding the email address
  try {
    const db = client.db("GDrive");
    let user = await db.collection("user").findOne({email:mail});
    if(user){
      let doc = await db.collection("user").updateOne({email:mail},{$set:{status:"Active"}})//change the status
      res.sendFile(path.join(__dirname, '../library/confirm.html'))//rendering a html file to confirm activation
    }
    else{
      res.sendStatus(400).json({
        message:"Link Invalid"
      })
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
})

router.post("/login",async(req,res)=>{
  const client = await MongoClient.connect(dbUrl);
  const {email,password}=req.body;
  try {
    const db = client.db("GDrive");
    const user =await db.collection("user").findOne({email:email});
    if(user){//check for existing user
      if(user.status=="Active"){//check for the status
        const compare = await hashCompare(password,user.password);
        if(compare){
          //generate token
            const token = await createJWT({
              email
            })
            res.status(200).json({
              token,
              message:"Login Successfull"
            })
        }else{
            res.status(400).json({//if password is wrong
            message:"Invalid Password"
          })
        }
      }
      else{
        const token = await createJWT({//token generation
          email:user.email
        })
        const transport = await nodemailer.createTransport({//create transport
          service:"Gmail",//service provider
          auth:{
            user:sender,
            pass:pwd
          }
        })
        const sendConfirmationEmail = await transport.sendMail({//sending mail with activation link
          from:"nagarajansai2727@gmail.com",
          to:user.email,
          subject:"Account Activation",
          html:`<h2>Email Confirmation</h2>
          <h2>Hello ${user.firstName}</h2>
          <p>You are one step away to store your valuable data. Please confirm your email by clicking on the following link</p>
          <a href=http://localhost:3000/users/confirm/${token}> Click here</a>
          </div>`
        })
        res.status(401).json({//if account activation is pending
          message:"Account activation required",
          instruction:"Check your mail inbox for activation link"
        })
      }
    }
    else{
        res.status(404).json({//if user does not exist
          message:"No User Available"
        })
    }
  } catch (error) {
      console.log(error);
      res.sendStatus(400);
  }
  finally{
    client.close()//closing the connection
  }
})

router.post("/forgot-password",async(req,res)=>{
  const client = await MongoClient.connect(dbUrl);
  const email = req.body.email;
  try {
    const db = client.db("GDrive");
    const user = db.collection("user").findOne({email:email});
    if(user){
      const token = await createJWT({//token generation
        email:user.email
      })
      const transport = await nodemailer.createTransport({//create transport
        service:"Gmail",//service provider
        auth:{
          user:sender,
          pass:pwd
        }
      })
      const sendResetLink = await transport.sendMail({//sending mail with pwd reset link
        from:"nagarajansai2727@gmail.com",
        to:user.email,
        subject:"Password Reset Request",
        html:`<h2>Hello ${user.firstName}</h2>
        <p>We've recieved a request to reset the password for your GDrive account associated with your email.
        You can reset your password by clicking the link below</p>
        <a href=http://forntend-link/${token}> Reset Password</a>
        </div>`
      })
    }
    else{
      res.status(404).json({
        message:"Invalid User"
      })
    }
  } catch (error) {
      console.log(error);
      res.sendStatus(400);
  }
  finally{
    client.close();
  }
})

router.post("/reset",async(req,res)=>{
  const client = await MongoClient.connect(dbUrl);
  const {token,password} = req.body;
  const mail = await authenticate(token);//authenticating the token and decoding the email address
  try {
    const db = client.db("GDrive");
    let user = await db.collection("user").findOne({email:mail});
    if(user){
      const hash = await hashing(password);
      let doc = await db.collection("user").updateOne({email:mail},{$set:{password:hash}})//change the status
      res.sendFile(path.join(__dirname, '../library/pwdsuccess.html'))//rendering a html file to confirm activation
    }
    else{
      res.sendStatus(400).json({
        message:"Link Invalid"
      })
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
})
module.exports = router;
