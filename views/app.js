const fs = require('fs'),
express=require("express"),
path=require("path"),
methodOverride=require("method-override"),
mongoose=require("mongoose"),
bodyParser=require("body-parser"),
crypto=require("crypto"),
gridfs=require("gridfs-stream"),
multer=require("multer"),
ejs=require("ejs");
const dbURI='mongodb://rintaro:goldenboy8@ds261040.mlab.com:61040/4th';
const conn = mongoose.createConnection(dbURI,{useNewUrlParser:true});
const db=mongoose.connection;

 

 const app=express();


 app.set("view engine","ejs");
 app.use(methodOverride('_method')) 

// ensure mongoose connect
const GFSS= require('multer-gridfs-storage');
storage = new GFSS({
  db:conn,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename
        };
        resolve(fileInfo);
      });
    });
  }
})
 
 const upload=multer({storage:storage})

app.get("/",(req,res)=>{
  const gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db);
  gridFSBucket.find({},{limit:10}).toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.render("index",{files:false});

    }

    // Files exist
    return res.render("index",{files:files})
  });

})
app.get('/files', (req, res) => {
  const gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db);

  gridFSBucket.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }

    // Files exist
    return res.json(files);
  });
});

app.get("/image/:id",(req,res)=>{
  const gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db);

  const readstream=gridFSBucket.openDownloadStreamByName(req.params.id);
  readstream.pipe(res);

})
	
function checkLimit(req,res,next){
  const gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db);
  gridFSBucket.find().toArray((err, files) => {
    // Check if files
	  console.log(files.length);
    if (files.length===10) {
      return res.redirect("/");
    }
    next();
  });

}
app.post("/upload",checkLimit,upload.single("file"),(req,res,next)=>{
 
  const gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db);

  res.redirect("/");

})

app.delete("/files/:id",(req,res)=>{
  const gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db);
  var id = mongoose.Types.ObjectId(req.params.id);
 // gridFSBucket.find(req.params.id,{limit:1})
  gridFSBucket.delete(id,err => {
    if(err){
      return res.json({err:err});
    }
    res.redirect("/");
    })
});


app.listen(3000,()=>console.log("app is on"));

