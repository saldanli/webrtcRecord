let socket=io.connect('http://localhost:3000/socket.io');
socket.on('connection', function(socket){
    console.log('socket connection');
  });


const localContext = localCanvas.getContext('2d');
const remoteContext = remoteCanvas.getContext('2d');  
const src = './resources/wasm/libvpx/vpx-worker.js';  
const constraints={video: {width: 320, height: 240}};
const vpxenc_ = new Worker(src);
const vpxdec_ = new Worker(src);


    startWebCam();
    
    const width = 320;
    const height = 240;
  
    localCanvas.width = width;
    localCanvas.height = height;
    remoteCanvas.width = width;
    remoteCanvas.height = height;


    
    let bytesSent = 0;
    let frames = 0;
    let lastTime = Date.now();
    const fps = 30;
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
      console.log('bitrate', Math.floor(8000.0 * bytesSent / (now - lastTime)),
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
              sendChannel.send(view); // 64 KB max
          }
          bytesSent += encoded.length;
          frames++;
      }
  };
  vpxdec_.onmessage = e => {
      if (e.data.res) {
          const decoded = new Uint8Array(e.data.res);
          const frame = remoteContext.createImageData(320, 240);
          frame.data.set(decoded, 0);
          remoteContext.putImageData(frame, 0, 0);
      }
  };




  async function  startWebCam(){
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideo.srcObject=stream;   
  }
  