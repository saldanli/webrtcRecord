const port = 3000
const express = require('express');
const http = require('http');
const fs=require('file-system')
//make sure you keep this order
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);


app.get('/broadcast', (req, res) => res.sendFile(__dirname+'/public/broadcast.html'));
app.get('/webrtc', (req, res) => res.sendFile(__dirname+'/public/webrtc.html'));
app.get('/client', (req, res) => res.sendFile(__dirname+'/public/client.html'));
app.get('/', (req, res) => res.sendFile(__dirname+'/public/videoConf.html'));


app.use('/resources',express.static('public'));

var videoSreamChannel = io.of('/videoStreamChannel');
videoSreamChannel.on('connection', function(socket){
  console.log('someone connected');
 
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
 

  file=[]; 
  socket.on('record',({eof,data,room})=>{
    if(eof){
      eofFunc(room)
    }else if(data){
      file.push(data)
    }
  })



  
});


function eofFunc(room){

  var fileBuffer = Buffer.concat(file)

  var filePath=__dirname+'/tmp/'+room+'/'+makeid(5)+'.webm';

  fs.writeFile(filePath, fileBuffer, (err) => { 
    file=[]; 
    if (err) return socket.emit('upload error'); 
   // socket.emit('end upload');
});


}

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

var signalingRoom = io.of('/signalingChannel');
signalingRoom.on('connection', function(socket){
  console.log('signalingChannel someone connected');
  socket.on('disconnect', function(){
    console.log('signalingChannel user disconnected');
  });

  socket.on('join',function(room){
    console.log(`user connect to  room :${room}`)
    socket.join(room);
  });

  socket.on('signal',(ev)=>{

    console.log(JSON.stringify(ev));
    socket.broadcast.to(ev.room).emit("signal", ev.data);
  })
});




  server.listen(port, () => console.log(`Example app listening on port ${port}!`))
