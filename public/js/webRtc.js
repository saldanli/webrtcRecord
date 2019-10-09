
'use strict';



const startButton = document.getElementById('startButton');

const hangupButton = document.getElementById('hangupButton');
const registerRoom = document.getElementById('registerRoom');


hangupButton.disabled = true;
startButton.addEventListener('click', start);
hangupButton.addEventListener('click', hangup);
registerRoom.addEventListener('click', registerRoomFunc);

const logger={
  debug:(msg)=>{
    console.log(`%c${msg}`,'color:magenta');
  },
  log:(msg)=>{
    console.log(msg);
  },
  error:()=>{
    console.error(msg)
  }
}

let signaling={};
let signalingChannel=io.connect('https://localhost:8443/signalingChannel');
signalingChannel.on('connect', function(socket){
    console.log('Signnaling channel connection');
   
  });
 signalingChannel.on('signal',(data)=>{
   signaling.onmessage(data)
 }) 

 signaling.send= async (data)=>{
   signalingChannel.emit('signal',{'room':room.value,'data':data});
 }






  let worker = new Worker("/resources/js/worker.js");
  
  //video record option
  var options = {mimeType: 'video/webm;codecs=vp9'};
  var mediaRecorder;


  function handleDataAvailable(event) {
    if (event.data.size > 0) {
      worker.postMessage(event.data)    
    } else {
      // ...
    }
  }
  


  let startTime;
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  
  localVideo.addEventListener('loadedmetadata', function() {
    logger.log(`Local video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
  });
  
  remoteVideo.addEventListener('loadedmetadata', function() {
    logger.log(`Remote video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
  });
  
  remoteVideo.addEventListener('resize', () => {
    logger.log(`Remote video size changed to ${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`);
    // We'll use the first onsize callback as an indication that video has started
    // playing out.
    if (startTime) {
      const elapsedTime = window.performance.now() - startTime;
      logger.log('Setup time: ' + elapsedTime.toFixed(3) + 'ms');
      startTime = null;
    }
  });



  let localStream;
  let remoteStream;
  
  async function start() {
    logger.debug('Requesting local stream');
    startButton.disabled = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
      logger.debug('Received local stream');
      localVideo.srcObject = stream;
      localStream = stream;
      
      call();
    } catch (e) {
      alert(`getUserMedia() error: ${e.name}`);
    }
  }

const constraints = {audio: true, video: true};
const configuration = {iceServers: [{url:'stun:stun.l.google.com:19302'}]};
const pc = new RTCPeerConnection(configuration);

  // send any ice candidates to the other peer
pc.onicecandidate = ({candidate}) =>{
  logger.debug(`ice candidate ${candidate}`);
  signaling.send({candidate});
} 

// let the "negotiationneeded" event trigger offer generation
pc.onnegotiationneeded = async () => {
  try {
    await pc.setLocalDescription(await pc.createOffer());
    // send the offer to the other peer
    signaling.send({desc: pc.localDescription});
  } catch (err) {
    console.error(err);
  }
};

// once remote track media arrives, show it in remote video element
pc.ontrack = (event) => {
  // don't set srcObject again if it is already set.
  if (remoteVideo.srcObject) return;
  remoteStream=event.streams[0];
  remoteVideo.srcObject = remoteStream;
  mediaRecorder = new MediaRecorder(remoteStream, options);
  hangupButton.disabled = false;
  
  mediaRecorder.ondataavailable = (e)=>  { 
      if (e.data.size > 0) {
        worker.postMessage(e.data)
      } else {
        // ...
      }
};
  mediaRecorder.start(100);
  
};

pc.oniceconnectionstatechange = function() {
  if(pc.iceConnectionState == 'disconnected') {
    logger.debug('disconnecting remote peer')
    hangup();
  }
}

  async function call() {
    
    hangupButton.disabled = false;
    logger.log('Starting call');
    startTime = window.performance.now();
   
    try{
      const stream =await navigator.mediaDevices.getUserMedia(constraints);
      /**
       * The newer addTrack() API avoids confusion over whether later changes 
       * to the track-makeup of a stream affects a peer connection (they do not).
       * The exception is in Chrome, where addStream() does make the peer connection sensitive 
       * to later stream changes (though such changes do not fire the negotiationneeded event). 
       * If you are relying on the Chrome behavior, note that other browsers do not have it.
       *  You can write web compatible code using feature detection instead:
       *
       */
      stream.getTracks().forEach(function(track) {
        pc.addTrack(track, stream);
      });
      localStream=stream;
      localVideo.srcObject = stream;
    } catch (err) {
      logger.error(err);
    }
  }

  signaling.onmessage = async ({desc, candidate}) => {
    try {
      if (desc) {
        // if we get an offer, we need to reply with an answer
        if (desc.type === 'offer') {
          await pc.setRemoteDescription(desc);
          const stream =
            await navigator.mediaDevices.getUserMedia(constraints);
          stream.getTracks().forEach((track) =>
            pc.addTrack(track, stream));
            localVideo.srcObject=stream;
            localStream=stream;
          await pc.setLocalDescription(await pc.createAnswer());
          signaling.send({desc: pc.localDescription});
        } else if (desc.type === 'answer') {
          await pc.setRemoteDescription(desc);
        } else {
          console.log('Unsupported SDP type.');
        }
      } else if (candidate) {
        await pc.addIceCandidate(candidate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  
  
  
  function hangup() {
    console.log('Ending call');


    pc.close();
    hangupButton.disabled = true;
    registerRoom.disabled=false;
    room.disabled=false; 
    localStream.getTracks().forEach(track=>{
      track.stop();
    });

    remoteStream.getTracks().forEach(track=>{
      track.stop();
    })
    mediaRecorder.stop();
    worker.postMessage({eof:true,room:room.value});
  }

  function download() {
    var blob = new Blob(recordedChunks, {
      type: 'video/webm'
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = 'test.webm';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function registerRoomFunc(){
    room.disabled=true; 
    registerRoom.disabled=true; 
    signalingChannel.emit('join',room.value);
  }

 
 
  


