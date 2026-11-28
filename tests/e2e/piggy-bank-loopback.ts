import {createSocket} from 'node:dgram'
import {once} from 'node:events'
import type {Page} from '@playwright/test'

export async function piggyLoopbackStun(){
 const ip='127.0.0.1',socket=createSocket('udp4')
 socket.on('message',(message,peer)=>{
  if(peer.address!==ip||message.length<20||message.readUInt16BE(0)!==1||
   message.readUInt32BE(4)!==0x2112a442||message.readUInt16BE(2)!==message.length-20)return
  const reply=Buffer.alloc(32)
  reply.writeUInt16BE(0x0101,0);reply.writeUInt16BE(12,2)
  message.copy(reply,4,4,20)
  reply.writeUInt16BE(0x0020,20);reply.writeUInt16BE(8,22)
  reply[25]=1;reply.writeUInt16BE(peer.port^0x2112,26)
  peer.address.split('.').forEach((octet,i)=>{reply[28+i]=Number(octet)^reply[4+i]})
  socket.send(reply,peer.port,peer.address)
 })
 const ready=once(socket,'listening')
 socket.bind(0,ip)
 await ready
 return {
  configure:async (page:Page)=>{
   await page.getByText('Connection options',{exact:true}).click()
   await page.getByLabel('Custom STUN URLs (optional)').fill('stun:'+ip+':'+socket.address().port)
  },
  close:()=>socket.close(),
 }
}
