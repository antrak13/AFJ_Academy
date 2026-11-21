// Anima los visuales de las fichas cuando aparecen en pantalla y los repite con el botón ↻.
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export function animar(vis) {
  if (RM) return;
  vis.classList.remove('vis-anim'); void vis.offsetWidth; vis.classList.add('vis-anim');
}
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { animar(e.target); io.unobserve(e.target); } }), { threshold: .35 }) : null;
export function activarFichas(raiz) {
  raiz.querySelectorAll('.vis:not([data-activa])').forEach(vis => {
    vis.dataset.activa = '1';
    if (io) io.observe(vis); else animar(vis);
  });
}
document.addEventListener('click', e => { const b = e.target.closest?.('.vis-otra'); if (b) animar(b.closest('.vis')); });
