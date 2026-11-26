// Browser test transport only. Vite drops this module from the production bundle.
type Handler=(...args:any[])=>void
class Signals {
 private listeners=new Map<string,Set<Handler>>()
 on(name:string,cb:Handler){const set=this.listeners.get(name)??new Set();set.add(cb);this.listeners.set(name,set);return this}
 once(name:string,cb:Handler){const wrapper:Handler=(...args)=>{this.off(name,wrapper);cb(...args)};return this.on(name,wrapper)}
 off(name:string,cb:Handler){this.listeners.get(name)?.delete(cb);return this}
 emit(name:string,...args:any[]){for(const cb of [...this.listeners.get(name)??[]])cb(...args)}
}
class TestConnection extends Signals {
 open=false
 constructor(private socket:TestPeer,readonly other:string,readonly key:string){super()}
 send(data:string){this.socket.write({to:this.other,key:this.key,kind:'data',data})}
 close(){this.socket.write({to:this.other,key:this.key,kind:'close'});this.socket.peers.delete(this.key);this.open=false;this.emit('close')}
}
export class TestPeer extends Signals {
 private ws:WebSocket
 destroyed=false
 peers=new Map<string,TestConnection>()
 constructor(name?:string){
  super()
  const peer=name??crypto.randomUUID()
  this.ws=new WebSocket('ws://127.0.0.1:9002/?id='+peer)
  this.ws.addEventListener('error',()=>this.emit('error',new Error('Test relay error')))
  this.ws.addEventListener('message',({data})=>{
   const m=JSON.parse(data)
   if(m.kind==='registered'){this.emit('open',peer);return}
   if(m.kind==='missing'||m.kind==='duplicate'){this.emit('error',new Error('Test peer unavailable'));return}
   if(m.kind==='dial'){
    const c=new TestConnection(this,m.from,m.key)
    this.peers.set(m.key,c);this.emit('connection',c)
    c.open=true;c.emit('open')
    this.write({to:m.from,key:m.key,kind:'ack'})
    return
   }
   const conn=this.peers.get(m.key)
   if(!conn)return
   if(m.kind==='ack'){conn.open=true;conn.emit('open')}
   if(m.kind==='data')conn.emit('data',m.data)
   if(m.kind==='close'){this.peers.delete(m.key);conn.open=false;conn.emit('close')}
  })
 }
 write(obj:object){if(this.ws.readyState===WebSocket.OPEN)this.ws.send(JSON.stringify(obj))}
 connect(other:string){
  const key=crypto.randomUUID(),c=new TestConnection(this,other,key)
  this.peers.set(key,c);this.write({to:other,key,kind:'dial'});return c
 }
 reconnect(){/* retry creates a new transport */}
 destroy(){if(this.destroyed)return;this.destroyed=true;for(const c of this.peers.values())c.close();this.ws.close()}
}
