/* 图提取 ImageGrab 官网交互：汉堡菜单 / 滚动淡入 / 导航高亮 */

// ===== 移动端汉堡菜单 =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
// 点击锚点后自动收起菜单
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ===== 滚动进入视口淡入上移 =====
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

// ===== 滚动监听：当前区块导航高亮 =====
const spyLinks = document.querySelectorAll('.nav-links a[data-spy]');
const sections = [...spyLinks].map(a => document.getElementById(a.dataset.spy));

function onScroll() {
  const y = window.scrollY + 120;
  let current = sections[0]?.id;
  sections.forEach(sec => { if (sec && sec.offsetTop <= y) current = sec.id; });
  spyLinks.forEach(a => a.classList.toggle('active', a.dataset.spy === current));
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
