/* ============================================================
 * 图提取 ImageGrab - content.js
 * 职责：在淘宝/天猫/京东/拼多多商家版页面右下角注入「获取图片」按钮，
 *       点击后扫描页面商品图片（img / srcset / 懒加载属性 / 背景图），
 *       过滤、补全绝对路径、去重后发送给 background。
 * ============================================================ */

// 防止脚本被重复注入
if (!window.__igInjected) {
  window.__igInjected = true;

  /* ---------- 悬浮按钮 ---------- */
  function createButton() {
    const btn = document.createElement('button');
    btn.id = 'ig-float-btn';
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="3" y="3" width="18" height="18" rx="3"/>' +
      '<circle cx="8.5" cy="8.5" r="1.8"/>' +
      '<path d="M21 15l-5-5L5 21"/>' +
      '</svg><span>获取图片</span>';
    btn.addEventListener('click', onFetchClick);
    document.body.appendChild(btn);

    const toast = document.createElement('div');
    toast.id = 'ig-toast';
    document.body.appendChild(toast);
    return { btn, toast };
  }

  /* ---------- 轻提示 ---------- */
  let toastTimer = null;
  function showToast(toast, msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  /* ---------- 解析 srcset，取分辨率最高的一张 ---------- */
  function parseSrcset(srcset) {
    if (!srcset) return '';
    let best = '', bestW = 0;
    srcset.split(',').forEach(part => {
      const seg = part.trim().split(/\s+/);
      const url = seg[0];
      const w = parseInt(seg[1], 10) || 0;
      if (url && w >= bestW) { best = url; bestW = w; }
    });
    return best;
  }

  /* ---------- 把相对路径补全为绝对 URL ---------- */
  function toAbsolute(u) {
    if (!u) return '';
    u = u.trim();
    if (u.startsWith('//')) u = location.protocol + u;
    try { return new URL(u, location.href).href; } catch (e) { return ''; }
  }

  /* ---------- 判断是否为有效商品图地址 ---------- */
  function isValidUrl(u) {
    if (!u) return false;
    if (u.startsWith('data:')) return false;          // 过滤 base64 图标
    if (!/^https?:\/\//i.test(u)) return false;
    return /\.(jpe?g|png|webp|gif|bmp)(\?|#|$)/i.test(u) || /img|image|pic|photo|alibaba|taobaocdn|jdcdn|pdd/i.test(u);
  }

  /* ---------- 扫描页面全部候选图片 ---------- */
  function collectImages() {
    const set = new Map(); // key=url, value={url,w,h,alt}

    const push = (raw, w, h, alt) => {
      const url = toAbsolute(raw);
      if (!isValidUrl(url) || set.has(url)) return;
      set.set(url, { url, w: w || 0, h: h || 0, alt: alt || '' });
    };

    // 1) <img> 标签：当前 src、srcset、各类懒加载属性
    document.querySelectorAll('img').forEach(img => {
      const candidates = [
        img.currentSrc,
        img.src,
        parseSrcset(img.srcset),
        img.dataset.src,
        img.dataset.lazySrc,
        img.dataset.original,
        img.dataset.ksLazyload
      ];
      candidates.forEach(c => push(c, img.naturalWidth, img.naturalHeight, img.alt));
    });

    // 2) 元素背景图 background-image
    document.querySelectorAll('*').forEach(el => {
      const bg = getComputedStyle(el).backgroundImage;
      const m = bg && bg.match(/url\(["']?(.*?)["']?\)/);
      if (m && m[1]) push(m[1], el.offsetWidth, el.offsetHeight, '');
    });

    return [...set.values()];
  }

  /* ---------- 点击「获取图片」 ---------- */
  async function onFetchClick() {
    const { btn, toast } = window.__igUI;
    btn.disabled = true;
    showToast(toast, '正在扫描页面图片…');

    const images = collectImages();

    if (!images.length) {
      showToast(toast, '没有扫描到图片，请先滚动到商品图区域再试');
      btn.disabled = false;
      return;
    }

    // 发送给 background：保存并打开画廊页
    chrome.runtime.sendMessage({ type: 'IG_EXTRACT', images }, resp => {
      btn.disabled = false;
      if (chrome.runtime.lastError) {
        showToast(toast, '扩展通信失败，请刷新页面后重试');
        return;
      }
      showToast(toast, `已提取 ${images.length} 张图片，正在打开预览页…`);
    });
  }

  /* ---------- 启动 ---------- */
  window.addEventListener('load', () => {
    window.__igUI = createButton();
  });
}
