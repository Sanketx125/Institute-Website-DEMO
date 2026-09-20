import { shell } from './components/shell.js';
import { route, installLinkInterceptor, navigate, updateLinks } from './lib/router.js';
import { admissionsGateway } from './services/admissionsGateway.js';
import { leadGateway } from './services/leadGateway.js';
import { programs, certifications, institution } from './data/content.js';
import { home, programsPage, programDetail, certificationsPage, comparePage, admissionsPage, placementsPage, campusPage, aboutPage, resourcesPage, parentsPage, visitPage, contactPage, applyPage, trackPage, notFound } from './pages/views.js';
import { icon } from './components/icons.js';

const app = document.querySelector('#app');
installLinkInterceptor();
window.addEventListener('popstate', render);

function render(){
  const r = route();
  let view;
  if(r.path==='/') view=home();
  else if(r.path==='/programs') view=programsPage();
  else if(r.bits[0]==='programs' && r.bits[1]) view=programDetail(r.bits[1]);
  else if(r.path==='/certifications') view=certificationsPage();
  else if(r.path==='/compare') view=comparePage();
  else if(r.path==='/admissions') view=admissionsPage();
  else if(r.path==='/placements') view=placementsPage();
  else if(r.path==='/campus') view=campusPage();
  else if(r.path==='/about') view=aboutPage();
  else if(r.path==='/resources') view=resourcesPage();
  else if(r.path==='/parents') view=parentsPage();
  else if(r.path==='/visit') view=visitPage();
  else if(r.path==='/contact') view=contactPage();
  else if(r.path==='/apply') view=applyPage();
  else if(r.path==='/track') view=trackPage();
  else view=notFound();
  app.innerHTML = shell(view);
  updateLinks();
  bindCommon();
  bindPage(r.path);
  document.title = titleFor(r.path);
}

function titleFor(path){
  if(path==='/') return institution.name;
  const label = path.split('/').filter(Boolean).map(x=>x.replaceAll('-',' ')).join(' - ');
  return label.replace(/\b\w/g,c=>c.toUpperCase()) + ' | ' + institution.name;
}

function bindCommon(){
  const drawer = document.querySelector('.mobile-drawer');
  const backdrop = document.querySelector('.drawer-backdrop');
  const openDrawer = ()=>{drawer.classList.add('open'); backdrop.classList.add('show'); drawer.setAttribute('aria-hidden','false');};
  const closeDrawer = ()=>{drawer.classList.remove('open'); backdrop.classList.remove('show'); drawer.setAttribute('aria-hidden','true');};
  document.querySelector('.menu-open')?.addEventListener('click',openDrawer);
  document.querySelector('.menu-close')?.addEventListener('click',closeDrawer);
  backdrop?.addEventListener('click',closeDrawer);

  const search = document.querySelector('.search-overlay');
  const searchInput = document.querySelector('#global-search');
  const openSearch = ()=>{search.classList.add('open');search.setAttribute('aria-hidden','false');setTimeout(()=>searchInput?.focus(),50);};
  const closeSearch = ()=>{search.classList.remove('open');search.setAttribute('aria-hidden','true');};
  document.querySelector('.search-open')?.addEventListener('click',openSearch);
  document.querySelector('.search-close')?.addEventListener('click',closeSearch);
  search?.addEventListener('click',e=>{if(e.target===search) closeSearch();});
  searchInput?.addEventListener('input',()=>renderSearch(searchInput.value));
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();} if(e.key==='Escape'){closeSearch();closeDrawer();closeAi();}} , {once:true});

  document.querySelector('.ai-fab')?.addEventListener('click',openAi);
  document.querySelector('.ai-close')?.addEventListener('click',closeAi);
  document.querySelectorAll('.ai-suggestions button').forEach(b=>b.addEventListener('click',()=>askAi(b.textContent)));
  document.querySelector('#ai-form')?.addEventListener('submit',e=>{e.preventDefault();const q=document.querySelector('#ai-question'); if(q.value.trim()) askAi(q.value.trim());q.value='';});
}

function renderSearch(q){
  const root = document.querySelector('#search-results');
  const term = q.trim().toLowerCase();
  if(!term){root.innerHTML='<div class="search-empty">Start typing to search programs, admissions and campus information.</div>';return;}
  const rows = [
    ...programs.map(p=>({title:p.code+' - '+p.title, text:p.summary+' '+p.specializations.join(' '), href:'/programs/'+p.slug, type:'Program'})),
    ...certifications.map(c=>({title:c.title,text:c.group+' '+c.text,href:'/certifications',type:'Certification'})),
    {title:'Admissions process',text:'eligibility documents apply application status',href:'/admissions',type:'Admissions'},
    {title:'Campus life and hostel',text:'hostel cafeteria wifi campus visit facilities',href:'/campus',type:'Campus'},
    {title:'Placements and careers',text:'placements recruiters industry career internships',href:'/placements',type:'Careers'},
    {title:'For parents',text:'parents recognition hostel campus programs admissions careers',href:'/parents',type:'Guide'},
    {title:'Book a campus visit',text:'campus visit appointment admissions directions',href:'/visit',type:'Visit'},
    {title:'Contact admissions',text:'phone email address directions callback',href:'/contact',type:'Contact'}
  ].filter(x=>(x.title+' '+x.text).toLowerCase().includes(term)).slice(0,8);
  root.innerHTML = rows.length ? rows.map(x=>`<a href="${x.href}" data-link><span>${x.type}</span><strong>${x.title}</strong><small>${x.text.slice(0,105)}${x.text.length>105?'...':''}</small></a>`).join('') : '<div class="search-empty">No exact match. Try a program name, admissions, hostel or career.</div>';
  updateLinks();
  root.querySelectorAll('a[data-link]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigate(a.getAttribute('href'));}));
}

function openAi(){const p=document.querySelector('.ai-panel');p.classList.add('open');p.setAttribute('aria-hidden','false');}
function closeAi(){const p=document.querySelector('.ai-panel');if(p){p.classList.remove('open');p.setAttribute('aria-hidden','true');}}
function askAi(question){
  openAi(); const body=document.querySelector('#ai-body');
  body.insertAdjacentHTML('beforeend',`<div class="ai-message user">${escapeHtml(question)}</div>`);
  const q=question.toLowerCase();
  const mentioned=programs.find(p=>q.includes(p.slug) || q.includes(p.code.toLowerCase()) || q.includes(p.title.toLowerCase()));
  let answer;
  if(q.includes('eligib')){
    if(mentioned) answer=`For ${mentioned.code}, ${mentioned.eligibility} Admissions can confirm any intake-specific conditions.`;
    else answer=`The undergraduate programs currently list 10+2 from a recognized board as the entry route. BBA, BCA and B.Com show a minimum 50% aggregate, with 45% for SC/ST/OBC candidates. You can open a program page for details.`;
  } else if(q.includes('hostel')){
    answer=`Yes. Deekshaam lists residential hostel facilities with warden support. Contact admissions for room availability, fees, mess details and hostel rules.`;
  } else if(q.includes('apply')||q.includes('admission')){
    answer=`Start from Apply Now, complete your profile, choose a program and add academic information. After submission you receive an application ID that can be used in the Applicant Portal to follow the admission process.`;
  } else if(q.includes('fee')){
    answer=`For the latest fee structure, select your program and contact admissions. Program fees and academic charges should be confirmed for the applicable intake.`;
  } else if(mentioned){
    answer=`${mentioned.code} — ${mentioned.summary} Specialization options include ${mentioned.specializations.slice(0,4).join(', ')}. You can open the ${mentioned.code} page for curriculum, eligibility and career pathways.`;
  } else if(q.includes('tech')||q.includes('software')||q.includes('coding')){
    const p=programs.find(x=>x.slug==='bca'); answer=`A technology-focused starting point is ${p.code}. ${p.kicker}. The program includes ${p.curriculum.flat().slice(0,6).join(', ')} and later-stage project work.`;
  } else if(q.includes('business')||q.includes('management')||q.includes('marketing')){
    const p=programs.find(x=>x.slug==='bba'); answer=`For management, marketing and operations, explore ${p.code}. Specializations include ${p.specializations.slice(0,5).join(', ')}.`;
  } else if(q.includes('finance')||q.includes('account')||q.includes('commerce')){
    const p=programs.find(x=>x.slug==='bcom'); answer=`For accounting, finance, banking and commerce, explore ${p.code}. Career pathways shown include ${p.careers.slice(0,5).join(', ')}.`;
  } else if(q.includes('certificate')||q.includes('certification')){
    answer=`Deekshaam lists ${certifications.length} professional certification options across ${[...new Set(certifications.map(x=>x.group))].join(', ')}. You can open Professional Certifications to explore each pathway.`;
  } else {
    answer=`I can help you explore programs, eligibility, admissions, campus facilities, career pathways and professional certifications. Try asking “Which program is best for technology?” or “What is BBA eligibility?”`;
  }
  setTimeout(()=>{body.insertAdjacentHTML('beforeend',`<div class="ai-message bot">${answer}</div>`);body.scrollTop=body.scrollHeight;},220);
}

function escapeHtml(s){return s.replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[m]));}

function bindPage(path){
  if(path==='/') bindHome();
  if(path==='/contact') bindContact();
  if(path==='/visit') bindVisit();
  if(path==='/apply') bindApplication();
  if(path==='/track') bindTrack();
}

function bindHome(){
  const result = document.querySelector('#finder-result');
  const map = {
    technology:['BCA','Software, data, cloud and intelligent systems','/programs/bca'],
    business:['BBA','Management, analytics and digital business','/programs/bba'],
    finance:['B.Com','Accounting, finance and modern business','/programs/bcom']
  };
  document.querySelectorAll('[data-interest]').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('[data-interest]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');
    const [code,text,href]=map[b.dataset.interest]; result.innerHTML=`<span class="eyebrow">Suggested starting point</span><h3>${code}</h3><p>${text}</p><a class="btn btn-primary" href="${href}" data-link>Explore ${code} ${icon('arrow',16)}</a>`; result.querySelector('a').addEventListener('click',e=>{e.preventDefault();navigate(href);});
  }));
}

function bindContact(){
  document.querySelector('#enquiry-form')?.addEventListener('submit',async e=>{e.preventDefault(); const data=Object.fromEntries(new FormData(e.target).entries()); await leadGateway.enquiry(data); e.target.innerHTML='<div class="success-state">'+icon('check',30)+'<h2>Thank you. Your enquiry has been captured.</h2><p>Our admissions team will use the details you provided to follow up on your enquiry.</p><a class="btn btn-primary" href="/programs" data-link>Explore programs '+icon('arrow',16)+'</a></div>'; e.target.querySelector('a').addEventListener('click',ev=>{ev.preventDefault();navigate('/programs');});});
}

function bindVisit(){
  const date=document.querySelector('#visit-date');
  if(date){const d=new Date(); const iso=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); date.min=iso;}
  document.querySelector('#visit-form')?.addEventListener('submit',async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target).entries());await leadGateway.campusVisit(data);e.target.innerHTML=`<div class="success-state">${icon('check',30)}<h2>Visit request received.</h2><p>Admissions can contact you to confirm the requested date and time.</p><a class="btn btn-primary" href="/campus" data-link>Explore campus ${icon('arrow',16)}</a></div>`;});
}

function bindApplication(){
  const form=document.querySelector('#application-form'); if(!form) return;
  let step=1;
  let draftId=null;
  const saved=admissionsGateway.latestDraft();
  if(saved){
    draftId=saved.id;
    for(const [name,value] of Object.entries(saved)){
      const fields=[...form.querySelectorAll(`[name="${name}"]`)];
      if(!fields.length) continue;
      for(const field of fields){
        if(field.type==='radio') field.checked=field.value===String(value);
        else if(field.type!=='checkbox' && value!=null && typeof value!=='object') field.value=String(value);
      }
    }
    setTimeout(()=>toast('Saved application restored'),120);
  }
  const qs=new URLSearchParams(location.search); const selected=qs.get('program');
  if(selected){const radio=form.querySelector(`input[name="program"][value="${selected}"]`); if(radio) radio.checked=true;}
  const show=(n)=>{step=n;form.querySelectorAll('[data-form-step]').forEach(s=>s.hidden=Number(s.dataset.formStep)!==step);document.querySelectorAll('.apply-steps button').forEach(b=>b.classList.toggle('active',Number(b.dataset.step)===step));document.querySelector('#prev-step').disabled=step===1;document.querySelector('#next-step').hidden=step===4;document.querySelector('#submit-application').hidden=step!==4;if(step===4) fillReview();};
  const validate=()=>{const sec=form.querySelector(`[data-form-step="${step}"]`);const required=[...sec.querySelectorAll('[required]')];for(const el of required){if((el.type==='radio' && !form.querySelector(`input[name="${el.name}"]:checked`)) || (el.type==='checkbox'&&!el.checked) || (!['radio','checkbox'].includes(el.type)&&!el.value.trim())){el.focus();el.reportValidity();return false;}}return true;};
  document.querySelector('#next-step').addEventListener('click',()=>{if(validate()) show(Math.min(4,step+1));});
  document.querySelector('#prev-step').addEventListener('click',()=>show(Math.max(1,step-1)));
  document.querySelector('#save-draft').addEventListener('click',async()=>{const row=await admissionsGateway.saveDraft(Object.fromEntries(new FormData(form).entries()),draftId); draftId=row.id; toast('Application draft saved');});
  form.addEventListener('submit',async e=>{e.preventDefault();if(!validate()) return;const row=await admissionsGateway.submit(Object.fromEntries(new FormData(form).entries()),draftId);form.innerHTML=`<div class="submitted-state">${icon('check',42)}<span class="eyebrow">Application received</span><h2>Thank you, ${escapeHtml(row.fullName||'Applicant')}.</h2><p>Your application ID is</p><div class="application-id">${row.id}</div><p>Keep this ID to track progress.</p><div class="hero-actions"><a class="btn btn-primary" href="/track?id=${row.id}" data-link>Track application ${icon('arrow',16)}</a><a class="btn btn-ghost" href="/" data-link>Back to home</a></div></div>`;form.querySelectorAll('a[data-link]').forEach(a=>a.addEventListener('click',ev=>{ev.preventDefault();navigate(a.getAttribute('href'));}));});
  function fillReview(){const data=Object.fromEntries(new FormData(form).entries());const prog=programs.find(p=>p.slug===data.program);document.querySelector('#application-review').innerHTML=`<div><small>Applicant</small><strong>${escapeHtml(data.fullName||'-')}</strong><span>${escapeHtml(data.email||'')} &middot; ${escapeHtml(data.phone||'')}</span></div><div><small>Program</small><strong>${prog?prog.code:(data.program==='certification'?'Professional Certification':'-')}</strong><span>${escapeHtml(data.specialization||'No specialization entered')}</span></div><div><small>Academic</small><strong>${escapeHtml(data.stream||'-')}</strong><span>${escapeHtml(data.percentage||'-')}% &middot; ${escapeHtml(data.year12||'-')}</span></div>`;}
  show(1);
}

function bindTrack(){
  const input=document.querySelector('#track-id'); const params=new URLSearchParams(location.search); if(params.get('id')) input.value=params.get('id');
  document.querySelector('#track-form')?.addEventListener('submit',async e=>{e.preventDefault();const row=await admissionsGateway.find(input.value);const target=document.querySelector('#track-result');if(!row){target.innerHTML='<div class="empty-state error"><h3>No application found on this device.</h3><p>Check the application ID and try again.</p></div>';return;}const stages=['Application received','Document review','Admissions review','Decision','Enrollment'];target.innerHTML=`<div class="status-card"><span class="eyebrow">${row.id}</span><h2>${escapeHtml(row.fullName||'Applicant')}</h2><p>${escapeHtml(row.email||'')} &middot; ${escapeHtml(row.program||'').toUpperCase()}</p><div class="status-timeline">${stages.map((s,i)=>`<div class="${i<(row.stage||1)?'done':i===(row.stage||1)-1?'current':''}"><span>${i+1}</span><div><strong>${s}</strong><small>${i===0?'Submitted '+new Date(row.submittedAt).toLocaleDateString():i===1?'Pending document review':'Updates appear here as the application progresses'}</small></div></div>`).join('')}</div></div>`;});
  if(input.value) document.querySelector('#track-form').requestSubmit();
}

function toast(message){const t=document.createElement('div');t.className='toast';t.textContent=message;document.body.appendChild(t);setTimeout(()=>t.classList.add('show'),20);setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),250)},2600);}

render();
