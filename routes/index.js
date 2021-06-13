var express = require('express');
var router = express.Router();

const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
const{dbUrl,mongodb,MongoClient}=require("../dbConfig");

const multer = require("multer");
const upload = multer({dest:'./uploads'})
const {uploadFile,getFileStream} =require("../s3");
const{authenticate}=require("../library/auth");

router.get('/files/:token', async(req,res)=>{
  const mail = await authenticate(req.params.token);
  console.log(mail);
  const client = await MongoClient.connect(dbUrl);
  const db = client.db("GDrive");
  const userFiles = await db.collection("files").find({email:mail}).toArray()
  const key = userFiles[0].file.key;
  console.log(key)
  const readStream = getFileStream(key);
  readStream.pipe(res);
})

router.post('/upload/:token',upload.single('image'), async(req,res)=>{
  const file = req.file;
  //console.log(file);
  const result = await uploadFile(file);
  await unlinkFile(file.path);
  //console.log(result);
  const client = await MongoClient.connect(dbUrl);
  try{
    const mail = await authenticate(req.params.token);
    const db = client.db("GDrive");
    const details={
      email:mail,
      file:result
    }
    let user = await db.collection("files").insertOne(details);
  }catch(error){
    console.log(error);
    res.sendStatus(400);
  }finally{
    client.close();
  }
  res.send(result);
})
module.exports = router;