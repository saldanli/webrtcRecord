
if(importScripts){


    importScripts('/socket.io/socket.io.js')

    chunks=[];

    
    let videoStreamChannel=io.connect('https://10.76.204.176:8443/videoStreamChannel');
    videoStreamChannel.on('connect', function(socket){
        console.log('socket connection');
    
    });


    videoStreamChannel.on('sendAgain', function(socket){
       // self.postMessage('sendAgain')
        var chunk=chunks.shift();    
        if(chunk){
            console.log(chunk);
            videoStreamChannel.emit('record',{data:chunk,eof:false,stream:true})
        }else{
            videoStreamChannel.emit('record',{data:'',eof:false,start:true})
            console.error('chunk null');
        }
        
        
    });

    

    self.onmessage=(msg)=>{       
       // let base64String = btoa(String.fromCharCode(...new Uint8Array(msg.data)));
       
       console.log(`worker data incoming Messsage ${msg.data}`)
        if (msg.data==='start'){
            videoStreamChannel.emit('record',{data:'',eof:false,start:true})
        }if (msg.data==='eof'){
           
            videoStreamChannel.emit('record',{data:'',eof:true})       
        }else{
            chunks.push(msg.data);  

        }
       
    }
}

