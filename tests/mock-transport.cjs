const {WebSocketServer}=require('ws')
const server=new WebSocketServer({host:'127.0.0.1',port:9002})
const sockets=new Map()
server.on('connection',(ws,req)=>{
 const id=new URL(req.url,'http://localhost').searchParams.get('id')
 if(!id||sockets.has(id)){ws.send(JSON.stringify({kind:'duplicate'}));ws.close();return}
 sockets.set(id,ws)
 const contacts=new Map()
 ws.send(JSON.stringify({kind:'registered'}))
 ws.on('message',raw=>{
  let m;try{m=JSON.parse(raw)}catch{return}
  const target=sockets.get(m.to)
  if(!target){if(m.kind==='dial')ws.send(JSON.stringify({kind:'missing'}));return}
  if(m.kind==='dial'||m.kind==='ack')contacts.set(m.key,m.to)
  if(m.kind==='close')contacts.delete(m.key)
  target.send(JSON.stringify({...m,from:id}))
 })
 ws.on('close',()=>{
  sockets.delete(id)
  for(const [key,to] of contacts)sockets.get(to)?.send(JSON.stringify({kind:'close',from:id,key}))
 })
})
