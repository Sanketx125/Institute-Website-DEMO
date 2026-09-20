const KNOWN_ROUTES = new Set([
  'programs', 'certifications', 'compare', 'admissions', 'placements',
  'campus', 'about', 'resources', 'parents', 'visit', 'contact', 'apply', 'track'
]);

export function getBasePath(){
  const parts = location.pathname.split('/').filter(Boolean);
  // If the first segment is not a recognized top-level route, it's a repository / subfolder base path
  if (parts.length > 0 && !KNOWN_ROUTES.has(parts[0])) {
    return '/' + parts[0];
  }
  return '';
}

export function navigate(path){
  const base = getBasePath();
  let target = path;
  if (base && !path.startsWith(base)) {
    target = base + (path.startsWith('/') ? path : '/' + path);
  }
  history.pushState({}, '', target);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({top:0, behavior:'smooth'});
}

export function updateLinks(){
  const base = getBasePath();
  if(!base) return;
  document.querySelectorAll('a[data-link]').forEach(a => {
    const href = a.getAttribute('href');
    if (href && href.startsWith('/') && !href.startsWith(base)) {
      a.setAttribute('href', base + href);
    }
  });
}

export function installLinkInterceptor(){
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a[data-link]');
    if(!a) return;
    const href = a.getAttribute('href');
    if(!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
    e.preventDefault();
    navigate(href);
  });
}

export function route(){
  const base = getBasePath();
  let path = location.pathname;
  if (base && path.startsWith(base)) {
    path = path.slice(base.length);
  }
  path = path.replace(/\/+$/,'') || '/';
  const bits = path.split('/').filter(Boolean);
  return {path, bits, base};
}
