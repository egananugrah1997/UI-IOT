
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const config = require("./keys.json");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
require("dotenv").config();
console.log(process.env.HOSTNAME);
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "/uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload = multer({ storage: storage }).single("file");

const app = express();
const port = process.env.PORT || 8074;
const server = require('http').createServer(app);

app.use(cors());
app.use(express.json({limit:'500mb'}));
app.use(express.urlencoded({limit:"500mb"}));
// app.use(jwt());

app.post("/routeData", function (req, res) {
  fs.appendFile(req.body.dest, req.body.fileString, "utf-8", function (err) {
    if (err) return res.status(400).send(err);
    res.status(200).send("Success");
  });
});
app.post("/upload", function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).send(req.file);
  });
});

const userRouter = require("./api/user.routes");
const mapRouter = require("./api/map.routes");
const rackRouter = require("./api/rack.routes");
const sequenceRouter = require("./api/seq.routes");
const jobRouter = require("./api/job.routes");
const qtDummyRouter = require("./api/quicktron.dummy")
const Sch = require("./api/sch.routes")
const masterData = require("./api/masterData.routes")
const Antrian = require("./api/queue.routes")
const Result = require("./api/result.route")
const Refill = require("./api/refill.routes")
const assy = require("./api/assyFlipFlop.routes")
const boxType = require("./api/boxType.routes")
const pack = require("./api/pack.routes")
const datatable = require("./api/datatable.routes")

app.use("/datatable",datatable)
app.use("/pack",pack)
app.use("/assy",assy)
app.use("/user", userRouter)
app.use("/map", mapRouter)
app.use("/rack", rackRouter)
app.use("/sequence", sequenceRouter)
app.use("/job", jobRouter)
app.use("/robot",qtDummyRouter)
app.use("/sch", Sch)
app.use("/masterData", masterData)
app.use("/queue", Antrian)
app.use("/result", Result)
app.use("/refill", Refill)
app.use("/boxType", boxType)

const uri = config.connectionString;
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false });

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

app.get("/assets/:filename", function (req, res) {
  res.sendFile(path.join(__dirname, "/assets/" + req.params.filename));
});

app.get("/panelDatas/:filename", function (req, res) {
  console.log("dor");
  res.sendFile(path.join(__dirname, "/panelDatas/" + req.params.filename));
});

app.get("/vgg", (req, res) => {
  res.sendFile(path.join(__dirname + "/UI-frontend/public/vgg.html"));
});

app.use(express.static(path.join(__dirname, "UI-frontend/build")));
app.use("/pdfs", express.static(__dirname + "/uploads"));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/UI-frontend/build/index.html"));
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

const io = require("socket.io")(server,{
  cors:{
    origin:["http://172.16.100.25:8076","http://172.16.100.166:3000","http://10.172.18.10:3001","http://10.172.18.10:3000","http://10.172.18.10:8074","http://10.172.18.13:3000","http://10.172.18.6:3000","http://10.172.18.15:3000"],
    methods:["GET","POST"]
  }
})
io.on("connection", (socket) => {
  console.log(`connect: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`disconnect: ${socket.id}`);
  });
  socket.on("message", (data) => {
    socket.broadcast.emit("message",data)
    console.log(data)
  });
});

server.listen(8075);    
