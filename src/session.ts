import type {Peer as PeerType,DataConnection} from 'peerjs'
import type {TestPeer} from './test-transport'
type Endpoint=PeerType|TestPeer
type Channel=DataConnection|ReturnType<TestPeer['connect']>
import {Host,decode,id,roomCode,type Snapshot,type Command} from './room'
export type ConnectOptions={iceServers?:RTCIceServer[]}
export type SessionState={phase:'connecting'|'online'|'offline',snapshot:Snapshot|null,error:string,receivedAt?:number,holdRejection?:string}
type Listener=(s:SessionState)=>void
export type Session={send:(c:Command,expectedMatch?:string)=>string|false;close:()=>void}
const namespace='imp-plan-v5-'
const sessionKey=(code:string)=>'arena-resume-'+code
const defaultIce=[{urls:'stun:stun.l.google.com:19302'}]
const sleep=(n:number)=>new Promise(r=>setTimeout(r,n))
const initial:SessionState={phase:'connecting',snapshot:null,error:''}
const send=(c:Channel,o:object)=>{if(c.open)c.send(JSON.stringify(o))}
let openPeer=async(options:ConnectOptions,code?:string):Promise<Endpoint>=>{
 const local=import.meta.env.VITE_TEST_SIGNAL==='1'
 const mock=import.meta.env.VITE_TEST_SIGNAL==='mock'
 const {Peer}=await import('peerjs')
 const opts={debug:0,config:{iceServers:options.iceServers??(local?[]:defaultIce)},...(local?{host:'127.0.0.1',port:9001,path:'/peer',secure:false}:{})}
 const peer:Endpoint=mock?new (await import('./test-transport')).TestPeer(code?namespace+code:undefined):code?new Peer(namespace+code,opts):new Peer(opts)
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>fail(new Error('Signaling timed out.')),8000)
  const fail=(e:unknown)=>{clearTimeout(timer);peer.destroy();reject(e)}
  peer.once('error',fail)
  peer.once('open',()=>{clearTimeout(timer);peer.off('error',fail);resolve(peer)})
 })
}
function notify(text:string){
 return text
}
export function practice(name:string,listener:Listener):Session{
 const h=new Host(name,()=>Math.floor(performance.timeOrigin+performance.now()),true)
 const update=(error='')=>listener({phase:'online',snapshot:h.snapshot('host'),error,receivedAt:performance.now()})
 h.command('host',id(),h.rev,{kind:'bot'})
 const timer=setInterval(()=>{if(h.tick())update()},200)
 update()
 return {send:c=>{const request=id();update(h.command('host',request,h.rev,c)??'');return request},close:()=>clearInterval(timer)}
}
export async function hostRoom(name:string,listener:Listener,options:ConnectOptions):Promise<Session&{code:string}>{
 listener(initial)
 let peer:Endpoint|undefined,code=''
 for(let i=0;i<3;i++){
  code=roomCode()
  try{peer=await openPeer(options,code);break}
  catch(e){if((e as {type?:unknown}).type!=='unavailable-id'||i===2)throw e}
 }
 if(!peer)throw Error('Could not reserve a code.')
 const service=peer
 const h=new Host(name,()=>Math.floor(performance.timeOrigin+performance.now()))
 const clients=new Map<string,{c:Channel,authorized:boolean,seq:number,seen:number,window:number,count:number}>()
 let holdRejection:string|undefined
 const ownUpdate=(error='')=>listener({phase:'online',snapshot:h.snapshot('host'),error,receivedAt:performance.now(),holdRejection})
 const sendState=(key:string)=>{
  const info=clients.get(key)
  if(!info?.authorized)return
  const state=h.snapshot(key)
  if(state)send(info.c,{type:'snapshot',state})
  else{send(info.c,{type:'closed',reason:'The host removed this seat.'});setTimeout(()=>info.c.close(),200)}
 }
 const update=(error='')=>{
  ownUpdate(error)
  for(const key of clients.keys())sendState(key)
  h.takeTimeHoldUpdates()
 }
 service.on('error',()=>ownUpdate('Signaling reported an error. New joins may be unavailable.'))
 service.on('disconnected',()=>{if(!service.destroyed)try{service.reconnect()}catch{/* already reconnecting */}})
 service.on('connection',c=>{
  if(clients.size>=32){c.on('open',()=>c.close());return}
  const key=id(),now=performance.now(),info={c,authorized:false,seq:0,seen:now,window:now,count:0}
  clients.set(key,info)
  const drop=()=>{
   if(!clients.delete(key))return
   const before=h.rev;h.disconnect(key);if(h.rev!==before)update()
  }
  c.on('close',drop);c.on('error',()=>{c.close();drop()})
  c.on('data',(raw:unknown)=>{
   const now=performance.now()
   if(now-info.window>=1000){info.window=now;info.count=0}
   if(++info.count>35){c.close();drop();return}
   const m=decode(raw)
   if(!m){send(c,{type:'error',reason:'Unsupported or malformed message.'});return}
   info.seen=now
   if(m.type==='hello'){
    if(info.authorized)return
    const result=h.join(key,m.name,m.token)
    if(!result){send(c,{type:'closed',reason:'Room is locked, full, playing, or this seat cannot be resumed.'});setTimeout(()=>c.close(),250);return}
    info.authorized=true
    const previous=clients.get(result.old);if(previous){clients.delete(result.old);previous.c.close()}
    send(c,{type:'accepted',token:result.token});update();return
   }
   if(!info.authorized)return
   if(m.type==='ping'){send(c,{type:'pong'});return}
   const privateHold=m.command.kind==='time-hold'
   const rejected=(reason:string)=>{
    if(m.command.kind==='time-hold'&&m.command.action==='hold')send(c,{type:'error',reason,holdRejection:m.request})
    else if(m.command.kind!=='time-hold')send(c,{type:'error',reason})
   }
   if(m.epoch!==h.epoch||m.match!==h.match||m.seq<=info.seq){
    rejected('This action no longer matches the current game.');return
   }
   info.seq=m.seq
   const before=h.rev,err=h.command(key,m.request,m.rev,m.command)
   if(privateHold||err||m.command.kind==='memory-lock'&&h.rev===before){
    if(err)rejected(err)
    sendState(key)
   }else update()
  })
 })
 const timer=setInterval(()=>{
  for(const [k,v] of clients)if(performance.now()-v.seen>(v.authorized?30000:8000)){
   clients.delete(k);h.disconnect(k);v.c.close();update()
  }
  if(h.tick())update()
  else for(const key of h.takeTimeHoldUpdates()){
   if(key==='host')ownUpdate()
   else sendState(key)
  }
 },200)
 update()
 return {code,send:(c,expectedMatch)=>{
  if(expectedMatch!==undefined&&expectedMatch!==h.match)return false
  const request=id(),before=h.rev,error=h.command('host',request,h.rev,c)??''
  if(c.kind==='time-hold'){
   if(error&&c.action==='hold')holdRejection=request
   ownUpdate(c.action==='hold'?error:'')
  }else if(c.kind==='memory-lock'&&h.rev===before)ownUpdate(error)
  else update(error)
  return request
 },close:()=>{
  clearInterval(timer)
  for(const v of clients.values())send(v.c,{type:'closed',reason:'The host ended this room.'})
  setTimeout(()=>service.destroy(),100)
 }}
}
export function joinRoom(code:string,name:string,listener:Listener,options:ConnectOptions):Session{
 let peer:Endpoint|undefined,conn:Channel|undefined,closed=false,terminal=false,seq=0,seen=0,error=''
 let snapshot:Snapshot|null=null
 let receivedAt:number|undefined,holdRejection:string|undefined,authorized=false
 let token:string|undefined
 try{const st=JSON.parse(sessionStorage.getItem(sessionKey(code))??'null');if(st?.name===name)token=st.token}catch{/* storage unavailable */}
 const tell=(phase:SessionState['phase'],err='')=>listener({phase,snapshot,error:err,receivedAt,holdRejection})
 const stop=()=>{conn?.close();peer?.destroy()}
 async function attempt(){
  tell('connecting')
  peer=await openPeer(options)
  if(closed){peer.destroy();return}
  const p=peer
  await new Promise<void>((resolve,reject)=>{
   const c=p.connect(namespace+code,{reliable:true,serialization:'raw'})
   conn=c;authorized=false;seq=0;seen=performance.now()
   let accepted=false
   const timer=setTimeout(()=>reject(new Error('Couldn’t reach this room. Check the code and try again.')),9000)
   const finish=(e?:Error)=>{clearTimeout(timer);e?reject(e):resolve()}
   c.on('open',()=>send(c,{version:1,type:'hello',name,token}))
   c.on('error',()=>finish(new Error('Peer connection failed.')))
   p.on('error',()=>finish(new Error('Room not found or peer connection failed.')))
   c.on('close',()=>finish())
   c.on('data',(raw:unknown)=>{
    if(typeof raw!=='string'||raw.length>128000)return
    try{
     const m=JSON.parse(raw)
     seen=performance.now()
     if(m.type==='accepted'&&/^[a-f0-9]{32}$/.test(m.token)){
      accepted=true;authorized=true;token=m.token;clearTimeout(timer)
      try{sessionStorage.setItem(sessionKey(code),JSON.stringify({name,token}))}catch{/* storage unavailable */}
     }
     if(m.type==='snapshot'&&accepted&&m.state&&typeof m.state.match==='string'){
      snapshot=m.state;receivedAt=performance.now();tell('online',error);error=''
     }
     if(m.type==='error'&&typeof m.reason==='string'){
      if(typeof m.holdRejection==='string'&&/^[a-f0-9]{32}$/.test(m.holdRejection))holdRejection=m.holdRejection
      error=notify(m.reason);tell(snapshot?'online':'connecting',error)
     }
     if(m.type==='closed'&&typeof m.reason==='string'){terminal=true;error=m.reason;finish()}
    }catch{/* ignore invalid host data */}
   })
  })
 }
 async function loop(){
  let err=''
  for(let i=0;i<4&&!closed&&!terminal;i++){
   try{await attempt();err='Host unavailable. Play is frozen.'}
   catch(e){err=e instanceof Error?e.message:'Connection failed.'}
   finally{stop()}
   if(closed||terminal||(!token&&!snapshot))break
   tell('offline',err+' Reconnecting…');await sleep(Math.min(800*2**i,5000)+Math.random()*350)
  }
  if(!closed)tell('offline',error||err||'Could not join the room.')
 }
 const heartbeat=setInterval(()=>{
  if(conn?.open){
   if(performance.now()-seen>26000)conn.close()
   else send(conn,{version:1,type:'ping'})
  }
 },5000)
 void loop()
 return {send:(command,expectedMatch)=>{
  if(!snapshot||!conn?.open||!authorized||(expectedMatch!==undefined&&expectedMatch!==snapshot.match))return false
  const request=id()
  send(conn,{version:1,type:'command',epoch:snapshot.epoch,match:snapshot.match,seq:++seq,request,rev:snapshot.rev,command})
  return request
 },close:()=>{closed=true;clearInterval(heartbeat);stop()}}
}
