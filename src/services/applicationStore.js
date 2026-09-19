const KEY = 'dbs_applications_v2';

function all(){
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function saveAll(rows){ localStorage.setItem(KEY, JSON.stringify(rows)); }

export const applicationStore = {
  list(){ return all(); },
  latestDraft(){
    return all().filter(x=>x.status==='Draft').sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))[0] || null;
  },
  saveDraft(data, existingId=null){
    const rows = all();
    const id = existingId || `DBS-DRAFT-${Date.now().toString().slice(-8)}`;
    const row = {...data, id, status:'Draft', updatedAt:new Date().toISOString()};
    const idx = rows.findIndex(x=>x.id===id);
    if(idx>=0) rows[idx]=row; else rows.push(row);
    saveAll(rows);
    return row;
  },
  submit(data, draftId=null){
    let rows = all();
    if(draftId) rows = rows.filter(x=>x.id!==draftId);
    const id = `DBS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random()*899999)}`;
    const row = {...data, id, status:'Application received', submittedAt:new Date().toISOString(), stage:1};
    rows.push(row);
    saveAll(rows);
    return row;
  },
  find(id){ return all().find(x=>x.id.toLowerCase() === String(id||'').trim().toLowerCase()) || null; }
};
