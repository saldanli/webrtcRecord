let videoStreamChannel=io.connect('http://localhost:3000/videoStreamChannel');
videoStreamChannel.on('connection', function(socket){
    console.log('socket connection');
   
  });


  

videoStreamChannel.emit('login','testRoom')

const localContext = localCanvas.getContext('2d');
const src = './resources/wasm/libvpx/vpx-worker.js';
const constraints={video: {width: 320, height: 240}};
const vpxenc_ = new Worker(src);




vpxenc_.postMessage({ type: 'init', data: vpxconfig_ });


    startWebCam();
    
    const width = vpxconfig_.width ;
    const height = vpxconfig_.height;
  
    localCanvas.width = width;
    localCanvas.height = height;
   


    
    let bytesSent = 0;
    let frames = 0;
    let lastTime = Date.now();
    const fps = vpxconfig_.fps;
    let encoding = false;

    
    setTimeout(() => {
        setInterval(() => {
            if (encoding) return; // TODO: apprtc is a bit smarter here.
            encoding = true;
            localContext.drawImage(localVideo, 0, 0, width, height);
            const frame = localContext.getImageData(0, 0, width, height);
            vpxenc_.postMessage({
                id: 'enc',
                type: 'call',
                name: 'encode',
                args: [frame.data.buffer]
            }, [frame.data.buffer]);
        }, 1000.0 / fps);
    }, 1000); // wait a bit before grabbing frames to give the wasm stuff time to init.




    setInterval(() => {
      const now = Date.now();
      console.log('bitrate', Math.floor(8000.0 * bytesSent / (now - lastTime))/parseFloat(1000000),
          'fps', Math.floor(1000.0 * frames / (now - lastTime)));
      bytesSent = 0;
      frames = 0;
      lastTime = now;
    }, 1000);



    vpxenc_.onmessage = e => {
      encoding = false;
      if (e.data.res) {
          const encoded = new Uint8Array(e.data.res);
          for (let offset = 0; offset < encoded.length; offset += 16384) {
              const length = Math.min(16384, encoded.length - offset);
              const view = new Uint8Array(encoded.buffer, offset, length);
              let base64String = btoa(String.fromCharCode(...new Uint8Array(view)));

              videoStreamChannel.emit('stream',{room:'testRoom',data:base64String}); // 64 KB max
          }
          bytesSent += encoded.length;
          frames++;
      }
  };
 




  async function  startWebCam(){
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideo.height=vpxconfig_.height;
    localVideo.width=vpxconfig_.width;
    localVideo.srcObject=stream;   
  }
  