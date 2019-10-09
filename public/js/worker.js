
if(importScripts){


    importScripts('/socket.io/socket.io.js')

    class ChunkArray extends Array {
        constructor(channel) {
            super();
            this.channel=channel;
        }
        push(chunk) {
            if(this.length==0){
                this.channel.emit('record',{data:chunk})
            }
            return super.push(arguments);
        }
    }

   
    
    let videoStreamChannel=io.connect(location.origin+'/videoStreamChannel');
    videoStreamChannel.on('connect', function(socket){
        console.log('Video stream socket connection');
    });


    videoStreamChannel.on('sendAgain', function(socket){
       // self.postMessage('sendAgain')
        var chunk=chunks.shift();    
        if(chunk){
            console.log(chunk);
            videoStreamChannel.emit('record',{data:chunk})
        }else{
            console.error('chunk null');
        }
    });

    let  chunks=new ChunkArray(videoStreamChannel) 

    self.onmessage=(msg)=>{       
       // let base64String = btoa(String.fromCharCode(...new Uint8Array(msg.data)));
        console.log(`worker data incaming Messsage ${JSON.stringify(msg.data)}`)
        if (msg.data.eof){
            videoStreamChannel.emit('record',{eof:true,room:msg.data.room})       
        }else{
            chunks.push(msg.data); 
        }
    }
}

