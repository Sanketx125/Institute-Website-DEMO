import { runtime, apiUrl } from '../config/runtime.js';

async function post(path,data){
  const url=apiUrl(path);
  if(url){
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    if(!res.ok) throw new Error(`Lead API request failed (${res.status})`);
    return res.status===204 ? {ok:true} : res.json();
  }
  return null;
}

function saveLocal(key,data){
  localStorage.setItem(key,JSON.stringify({...data,createdAt:new Date().toISOString()}));
  return {ok:true};
}

export const leadGateway = {
  async enquiry(data){ return (await post(runtime.endpoints.enquiry,data)) || saveLocal('dbs_last_enquiry',data); },
  async campusVisit(data){ return (await post(runtime.endpoints.campusVisit,data)) || saveLocal('dbs_last_visit_request',data); }
};
