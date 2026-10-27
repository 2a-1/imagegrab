/* ============================================================
 * 图提取 ImageGrab - background.js (Service Worker / MV3)
 * 职责：
 *  1. 接收 content.js 发来的图片列表，存入 storage 并打开画廊页；
 *  2. 接收画廊页的下载请求，fetch 图片 -> canvas 统一转 PNG -> chrome.downloads 保存。
 * ============================================================ */

/* ---------- 接收提取结果，存储并打开画廊 ---------- */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'IG_EXTRACT') {
    chrome.storage.local.set({ igImages: msg.images }, () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('gallery.html') });
      sendResponse({ ok: true, count: msg.images.length });
    });
    return true; // 异步 sendResponse
  }

  /* ---------- 单张下载：统一转 PNG ---------- */
  if (msg.type === 'IG_DOWNLOAD') {
    downloadAsPng(msg.url, msg.index)
      .then(() => sendResponse({ ok: true }))
      .catch(err => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
});

/* ---------- fetch 图片并转成 PNG 后下载 ---------- */
async function downloadAsPng(url, index) {
  const name = '商品图_' + String(index).padStart(3, '0') + '.png';
  let converted = false;

  try {
    const resp = await fetch(url, { mode: 'cors' });
    if (!resp.ok) throw new Error('fetch 失败 ' + resp.status);
    const blob = await resp.blob();
    const bmp = await createImageBitmap(blob);

    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    const pngBlob = await canvas.convertToBlob({ type: 'image/png' });

    await chrome.downloads.download({
      url: URL.createObjectURL(pngBlob),
      filename: name,
      saveAs: false
    });
    converted = true;
  } catch (e) {
    // 跨域无法转码时的兜底：直接下载原图（保留原格式）
    await chrome.downloads.download({ url, filename: name, saveAs: false });
  }
  return converted;
}
