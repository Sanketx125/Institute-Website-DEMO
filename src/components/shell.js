import { institution, programs } from '../data/content.js';
import { icon } from './icons.js';

function logo(){
  return `<a class="brand" href="/" data-link aria-label="${institution.name} home">
    <span class="brand-mark" aria-hidden="true"><svg class="brand-fallback" viewBox="0 0 48 58"><path d="M25 2c-1 13-12 16-12 28 0 7 4 13 11 17-1-10 8-13 10-22 7 5 11 11 11 18 0 6-3 11-8 15 9-2 17-10 17-21C42 20 31 15 25 2Z" fill="currentColor"/><path d="M25 27c-7 6-8 11-4 16 2 3 6 4 9 3-5-3-5-10-1-15 1-2 2-4 2-6-2 0-4 1-6 2Z" fill="#fff" opacity=".92"/></svg><img class="brand-official" src="${institution.logoImage}" alt="" onerror="this.style.display='none'"/></span>
    <span class="brand-copy"><strong>Deekshaam</strong><span>Business School</span></span>
  </a>`;
}

export function header(){
  return `<div class="topbar"><div class="container topbar-inner">
    <span>Managed by ${institution.managedBy}</span>
    <div><a href="/parents" data-link>For Parents</a><a href="/visit" data-link>Book Campus Visit</a><a href="tel:${institution.phone.replace(/\s/g,'')}">${icon('phone',14)} ${institution.phone}</a><a href="mailto:${institution.admissionEmail}">${institution.admissionEmail}</a></div>
  </div></div>
  <header class="site-header"><div class="container nav-wrap">
    ${logo()}
    <nav class="desktop-nav" aria-label="Primary">
      <div class="nav-item has-menu"><a href="/programs" data-link>Programs</a><div class="mega-menu"><div><span class="mega-label">Undergraduate</span>${programs.map(p=>`<a href="/programs/${p.slug}" data-link><strong>${p.code}</strong><small>${p.title}</small></a>`).join('')}</div><div><span class="mega-label">Explore</span><a href="/certifications" data-link><strong>Professional Certifications</strong><small>6-11 month career-focused programs</small></a><a href="/compare" data-link><strong>Compare Programs</strong><small>BBA vs BCA vs B.Com</small></a></div></div></div>
      <div class="nav-item has-menu"><a href="/admissions" data-link>Admissions</a><div class="mega-menu compact-menu"><div><span class="mega-label">Admissions</span><a href="/admissions" data-link><strong>Admission Process</strong><small>Eligibility, documents and steps</small></a><a href="/apply" data-link><strong>Apply Online</strong><small>Start or continue an application</small></a><a href="/track" data-link><strong>Track Application</strong><small>Check your application stage</small></a></div></div></div>
      <a href="/placements" data-link>Placements</a>
      <a href="/campus" data-link>Campus Life</a>
      <a href="/about" data-link>About</a>
      <a href="/resources" data-link>Resources</a>
    </nav>
    <div class="nav-actions">
      <button class="icon-btn search-open" aria-label="Search">${icon('search')}</button>
      <a class="btn btn-ghost small" href="/track" data-link>Applicant portal</a>
      <a class="btn btn-primary small" href="/apply" data-link>Apply now</a>
      <button class="icon-btn menu-open" aria-label="Open menu">${icon('menu')}</button>
    </div>
  </div></header>
  <div class="mobile-drawer" aria-hidden="true">
    <div class="drawer-head">${logo()}<button class="icon-btn menu-close" aria-label="Close menu">${icon('close')}</button></div>
    <nav>
      <a href="/programs" data-link>Programs</a><a href="/certifications" data-link>Certifications</a><a href="/admissions" data-link>Admissions</a><a href="/placements" data-link>Placements</a><a href="/campus" data-link>Campus Life</a><a href="/parents" data-link>For Parents</a><a href="/visit" data-link>Book Campus Visit</a><a href="/about" data-link>About</a><a href="/resources" data-link>Resources</a><a href="/contact" data-link>Contact</a>
    </nav>
    <a class="btn btn-primary full" href="/apply" data-link>Apply for admission ${icon('arrow')}</a>
  </div>
  <div class="drawer-backdrop"></div>`;
}

export function footer(){
  const prog = programs.map(p=>`<a href="/programs/${p.slug}" data-link>${p.code}</a>`).join('');
  return `<footer class="site-footer"><div class="container footer-grid">
    <div class="footer-brand">${logo()}<p>Career-focused undergraduate and professional learning built around practical skills, industry exposure and student support.</p><div class="footer-chip">Admissions: ${institution.phone}</div></div>
    <div><h4>Study</h4>${prog}<a href="/certifications" data-link>Professional Certifications</a><a href="/compare" data-link>Compare Programs</a></div>
    <div><h4>Admissions</h4><a href="/admissions" data-link>Admission Process</a><a href="/apply" data-link>Apply Online</a><a href="/track" data-link>Track Application</a><a href="/contact" data-link>Talk to Admissions</a></div>
    <div><h4>Explore</h4><a href="/placements" data-link>Placements & Careers</a><a href="/campus" data-link>Campus Life</a><a href="/parents" data-link>For Parents</a><a href="/visit" data-link>Book Campus Visit</a><a href="/about" data-link>About DBS</a><a href="/resources" data-link>News & Resources</a></div>
    <div><h4>Contact</h4><p>${institution.address}</p><a href="tel:${institution.phone.replace(/\s/g,'')}">${institution.phone}</a><a href="mailto:${institution.admissionEmail}">${institution.admissionEmail}</a><a href="/contact" data-link>Get directions</a></div>
  </div><div class="container footer-bottom"><span>&copy; ${new Date().getFullYear()} ${institution.managedBy}. All rights reserved.</span><span><a href="https://deekshaedu.in/privacy-policy/" target="_blank" rel="noopener">Privacy</a> &nbsp; <a href="/contact" data-link>Contact</a></span></div></footer>
  <div class="mobile-actionbar"><a href="tel:${institution.phone.replace(/\s/g,'')}">${icon('phone',18)}<span>Call</span></a><a href="/campus" data-link>${icon('map',18)}<span>Visit</span></a><a href="/apply" data-link>${icon('document',18)}<span>Apply</span></a></div>`;
}

export function searchOverlay(){
  return `<div class="search-overlay" aria-hidden="true"><div class="search-panel"><div class="search-row">${icon('search',22)}<input id="global-search" type="search" placeholder="Search programs, admissions, hostel, fees..." autocomplete="off"/><button class="icon-btn search-close" aria-label="Close search">${icon('close')}</button></div><div id="search-results" class="search-results"></div><div class="search-hint"><span>Try: BCA eligibility, hostel, digital marketing, application</span><span>ESC to close</span></div></div></div>`;
}

export function aiWidget(){
  return `<button class="ai-fab" aria-label="Open Deeksha AI Guide">${icon('spark',22)}<span>Ask Deeksha</span></button>
  <aside class="ai-panel" aria-hidden="true"><div class="ai-head"><div><span class="eyebrow">Admissions assistant</span><h3>Deeksha Guide</h3></div><button class="icon-btn ai-close" aria-label="Close AI Guide">${icon('close')}</button></div><div class="ai-body" id="ai-body"><div class="ai-message bot">Hi. I can help you explore programs, eligibility, admissions and campus information using Deekshaam's academic and admissions information.</div><div class="ai-suggestions"><button>Which program fits a tech career?</button><button>What is BCA eligibility?</button><button>Is hostel available?</button><button>How do I apply?</button></div></div><form class="ai-input" id="ai-form"><input id="ai-question" placeholder="Ask about programs or admissions..."/><button class="icon-btn" aria-label="Send">${icon('arrow')}</button></form></aside>`;
}

export function shell(content){
  return `${header()}<main id="main">${content}</main>${footer()}${searchOverlay()}${aiWidget()}`;
}
