import {Component,type ReactNode} from 'react'

class TableLoadError extends Error{}

export function loadTable<T>(load:()=>Promise<T>):Promise<T>{
 return load().catch(error=>{throw new TableLoadError('Could not load table assets',{cause:error})})
}

export class TableLoadBoundary extends Component<{title:string,children:ReactNode},{failed:boolean}>{
 state={failed:false}
 static getDerivedStateFromError(error:unknown){
  if(!(error instanceof TableLoadError))throw error
  return {failed:true}
 }
 render(){
  return this.state.failed?
   <p className="error" role="alert">{this.props.title} files aren’t available. {navigator.onLine?'Reload the page to try again.':'Reconnect, then reload to save the games for offline practice.'}</p>:
   this.props.children
 }
}
