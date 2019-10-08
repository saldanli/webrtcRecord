'use strict';

let receiveChannel=io.connect('http://localhost:3000/videoStreamChannel');
receiveChannel.on('connection', function(socket){
    console.log('socket connection');
   
  });

  receiveChannel.emit('login','testRoom')


const remoteContext = remoteCanvas.getContext('2d');
const src = './resources/wasm/libvpx/vpx-worker.js';  
const vpxdec_ = new Worker(src);

console.log([
  'Default VPX params:',
  '',
  '   ?codec=vp8    Can also use vp9.',
  '   ?width=640',
  '   ?height=480',
  '   ?vsbr=1500    Video bitrate in kilobits per second.',
  '   ?fps=30       fps=0 would allow to send frames one by one.',
  '   ?packet=16    The packet size in KB. Cannot exceed 64 KB.',
  '',
  'For example, to encode 720p video with VP9 use:',
  '',
  '   ?libvpx=1&codec=vp9&width=1280&height=720',
].join('\n'));





vpxdec_.postMessage({ type: 'init', data: vpxconfig_ });

const recvBuffer = [];
let decbuf = new Uint8Array(1 << 20);
let decbuflen = 0;
let encoding=false;

receiveChannel.on('dataAvailable',(ev) => {
   
  if(encoding) return;
    const data = Uint8Array.from(atob(ev.data), c => c.charCodeAt(0))
    decbuf.set(data, decbuflen);
    decbuflen += data.length;
    if (data.length == 16384)
        return; // wait for the final chunk of the incoming frame

    const packets = decbuf.slice(0, decbuflen);
    decbuflen = 0;
    /*
    const drop = Math.random() < 0.1;
    if (drop) return; // 10% packet loss.
    */
    vpxdec_.postMessage({
      id: 'dec',
      type: 'call',
      name: 'decode',
      args: [packets.buffer],
    }, [packets.buffer]);
  });


 
   

    
    const width = vpxconfig_.width;
    const height = vpxconfig_.height;

   
    remoteCanvas.width = width;
    remoteCanvas.height = height;

    let bytesSent = 0;
    let frames = 0;
    


    vpxdec_.onmessage = e => {
        encoding=false;
        if (e.data.res) {
            const decoded = new Uint8Array(e.data.res);
            const frame = remoteContext.createImageData(vpxconfig_.width, vpxconfig_.height);
            frame.data.set(decoded, 0);
            remoteContext.putImageData(frame, 0, 0);
        }
    };
