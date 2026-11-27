const {PeerServer} = require('peer');
PeerServer({host:'127.0.0.1',port:Number(process.env.E2E_SIGNAL_PORT??9001),path:'/peer'});
