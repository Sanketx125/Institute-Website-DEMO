export function navigate(path){
  history.pushState({},'',path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({top:0, behavior:'smooth'});
}

export function installLinkInterceptor(){
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a[data-link]');
    if(!a) return;
    const href = a.getAttribute('href');
    if(!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    e.preventDefault();
    navigate(href);
  });
}

export function route(){
  const path = location.pathname.replace(/\/+$/,'') || '/';
  const bits = path.split('/').filter(Boolean);
  return {path,bits};
}
