import { runtime, apiUrl } from '../config/runtime.js';
import { applicationStore } from './applicationStore.js';

async function request(path, options={}){
  const url=apiUrl(path);
  if(!url) return null;
  const res=await fetch(url,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  if(!res.ok) throw new Error(`Admissions API request failed (${res.status})`);
  return res.status===204 ? null : res.json();
}

export const admissionsGateway = {
  latestDraft(){ return applicationStore.latestDraft(); },
  async saveDraft(data,draftId){
    // Drafts stay on-device until applicant authentication is connected.
    return applicationStore.saveDraft(data,draftId);
  },
  async submit(data,draftId){
    if(runtime.apiBaseUrl){
      const row=await request(runtime.endpoints.applicationSubmit,{method:'POST',body:JSON.stringify(data)});
      return row;
    }
    return applicationStore.submit(data,draftId);
  },
  async find(id){
    if(runtime.apiBaseUrl){
      return request(`${runtime.endpoints.applicationStatus}/${encodeURIComponent(id)}`);
    }
    return applicationStore.find(id);
  }
};
