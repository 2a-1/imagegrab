/* ============================================================
 * 图提取 ImageGrab - gallery.js
 * 读取 storage 中的图片列表 -> 网格渲染 -> 勾选 -> 批量转 PNG 下载
 * ============================================================ */

const $ = id => document.getElementById(id);
let images = [];       // 全部候选
let visible = [];       // 过滤后真正展示的 {url, w, h, el}

/* ---------- 提示气泡 ---------- */
let toastTimer = null;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

/* ---------- 读取列表并渲染 ---------- */
chrome.storage.local.get('igImages', data => {
  images = data.igImages || [];
  if (!images.length) {
    $('status').textContent = '没有可展示的图片，请回到商品详情页重新点击「获取图片」。';
    return;
  }
  render();
});

function render() {
  const grid = $('grid');
  grid.innerHTML = '';
  visible = [];

  images.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div class="thumb"><img alt="商品图"></div>' +
      '<div class="meta"><input type="checkbox"><span class="dim"></span></div>';

    const img = card.querySelector('img');
    const box = card.querySelector('.dim');
    const cb = card.querySelector('input');

    // 图片加载完成后按真实尺寸过滤：小于 100x100 的图标/占位图不展示
    img.onload = () => {
      if (img.naturalWidth < 100 || img.naturalHeight < 100) {
        card.remove();
        return;
      }
      box.textContent = img.naturalWidth + '×' + img.naturalHeight;
      visible.push({ url: item.url, card, cb });
      updateTotal();
    };
    img.onerror = () => card.remove();
    img.src = item.url;

    cb.addEventListener('change', () => {
      card.classList.toggle('picked', cb.checked);
      updateCount();
    });

    grid.appendChild(card);
  });
}

function updateTotal() {
  $('total').textContent = visible.length;
  updateCount();
}

function updateCount() {
  $('picked').textContent = visible.filter(v => v.cb.checked).length;
}

/* ---------- 全选 / 反选 ---------- */
$('selectAll').addEventListener('click', () => {
  visible.forEach(v => { v.cb.checked = true; v.card.classList.add('picked'); });
  updateCount();
});

$('invert').addEventListener('click', () => {
  visible.forEach(v => {
    v.cb.checked = !v.cb.checked;
    v.card.classList.toggle('picked', v.cb.checked);
  });
  updateCount();
});

/* ---------- 批量下载 ---------- */
$('downloadBtn').addEventListener('click', async () => {
  const picked = visible.filter(v => v.cb.checked);
  if (!picked.length) { toast('请先勾选要下载的图片'); return; }

  const btn = $('downloadBtn');
  btn.disabled = true;
  let ok = 0;

  for (let i = 0; i < picked.length; i++) {
    toast(`正在下载 ${i + 1} / ${picked.length}…`);
    // 序号按本次勾选顺序从 1 开始补零编号
    const resp = await chrome.runtime.sendMessage({
      type: 'IG_DOWNLOAD',
      url: picked[i].url,
      index: i + 1
    });
    if (resp && resp.ok) ok++;
    await new Promise(r => setTimeout(r, 350)); // 间隔避免浏览器拦截
  }

  btn.disabled = false;
  toast(`完成：成功 ${ok} 张，已保存到浏览器默认下载目录`);
});
