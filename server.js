const HTTPS_PORT = 8443;

const port = 8443
const express = require('express');
const https = require('https');
const fs=require('file-system')
//make sure you keep this order
var app = express();

const serverConfig = {
  key: fs.readFileSync('certs/key.pem'),
  cert: fs.readFileSync('certs/cert.pem'),
};
var server = https.createServer(serverConfig, app);
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
  socket.on('login',(room)=>{
    socket.join(room)
  })
  socket.on('stream',(ev)=>{
    var a=Buffer.from(ev.data, 'utf-8')
    socket.in(ev.room).emit("dataAvailable", ev);
  })

  file=[];
  
  socket.on('record',(ev)=>{
    if(ev.eof){
      eof()
    }else if(ev.stream){
      file.push(ev.data)
      socket.emit("sendAgain");
    }else if(ev.start){
      socket.emit("sendAgain");
    }

    
    
  })



  
});


function eof(){

  file=file.filter(function(ele){
    return ele !== 'start';
  });
  var fileBuffer = Buffer.concat(file)

  var filePath='./tmp/'+makeid(5)+'.webm';

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
const SignalingRoom='Signalingroom';
var videoSreamChannel = io.of('/signalingChannel');
videoSreamChannel.on('connection', function(socket){
  console.log('someone connected');
  socket.join(SignalingRoom)
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('signal',(ev)=>{
    socket.in(SignalingRoom).emit("signal", ev);
  })
});




  server.listen(port, () => console.log(`Example app listening on port ${port}!`))
