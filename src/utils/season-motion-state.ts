import { useEffect, useSyncExternalStore } from "react";

const owners=new Set<symbol>(),listeners=new Set<()=>void>();
function notify(){listeners.forEach(fn=>fn());}
function subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function useSeasonOverlay(open:boolean){
  useEffect(()=>{
    if(!open)return;
    const owner=Symbol("calendar-overlay");owners.add(owner);notify();
    return()=>{owners.delete(owner);notify();};
  },[open]);
}
export function useSeasonOverlayOpen(){return useSyncExternalStore(subscribe,()=>owners.size>0,()=>false);}
