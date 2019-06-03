const fs = require('fs'),
express=require("express"),
path=require("path"),
methodOverride=require("method-override"),
mongoose=require("mongoose"),
crypto=require("crypto"),
multer=require("multer"),
GFSS= require('multer-gridfs-storage'),
ejs=require("ejs");
const dbURI='';
const conn = mongoose.createConnection(dbURI,{useNewUrlParser:true});
const db=mongoose.connection;

 

 const app=express();


 app.set("view engine","ejs");
 app.use(express.json());
 app.use(methodOverride('_method')); 

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

  let gridFSBucket;
app.get("/",(req,res)=>{
gridFSBucket= new mongoose.mongo.GridFSBucket(conn.db);
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
gridFSBucket= new mongoose.mongo.GridFSBucket(conn.db);

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

gridFSBucket= new mongoose.mongo.GridFSBucket(conn.db);
  const readstream=gridFSBucket.openDownloadStreamByName(req.params.id);
  readstream.pipe(res);

})
	
function checkLimit(req,res,next){
gridFSBucket= new mongoose.mongo.GridFSBucket(conn.db);
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
 

  res.redirect("/");

})

app.delete("/files/:id",(req,res)=>{
gridFSBucket= new mongoose.mongo.GridFSBucket(conn.db);
  var id = mongoose.Types.ObjectId(req.params.id);
  gridFSBucket.delete(id,err => {
    if(err){
      return res.json({err:err});
    }
    res.redirect("/");
    })
});

const port =process.env.PORT||3000
app.listen(port,()=>console.log(`application is running on port ${port}`));

