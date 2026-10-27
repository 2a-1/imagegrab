# 图提取 ImageGrab - 电商图片批量下载 Chrome 扩展

一键提取淘宝、天猫、京东、拼多多商家版商品详情页的所有商品图片，在新页面集中预览、勾选，批量下载为 PNG 格式。

## 文件结构

```
图提取-ImageGrab/
├─ manifest.json      # 扩展配置（Manifest V3）
├─ content.js         # 注入按钮 + 扫描提取页面图片
├─ content.css        # 右下角悬浮按钮样式
├─ background.js      # Service Worker：存储、打开画廊、转 PNG 下载
├─ gallery.html       # 图片集中预览页
├─ gallery.css        # 画廊页样式
├─ gallery.js         # 渲染、勾选、批量下载逻辑
├─ docs/              # 官方宣传静态网站（GitHub Pages 部署目录）
└─ README.md
```

## 安装步骤（开发者模式加载）

1. 打开 Chrome / Edge，地址栏输入 `chrome://extensions` 回车。
2. 打开右上角「开发者模式」开关。
3. 点击「加载已解压的扩展程序」，选择本文件夹（包含 manifest.json 的目录）。
4. 扩展出现在列表即安装成功。

## 使用方法

1. 打开淘宝 / 天猫 / 京东 / 拼多多商家版的商品详情页，滚动到商品图区域。
2. 点击页面右下角紫色「获取图片」按钮。
3. 自动打开画廊页，网格展示提取到的图片（已自动过滤图标、logo、占位图和小于 100×100 的小图）。
4. 勾选需要的图片（可全选 / 反选），点击「下载选中（PNG）」。
5. 图片自动转换为 PNG，按 `商品图_001.png`、`商品图_002.png`… 编号保存到浏览器默认下载目录。

## 说明

- 仅在匹配域名（taobao.com / tmall.com / jd.com / pinduoduo.com / yangkeduo.com）注入按钮，其他页面不显示。
- 个别受跨域保护的图片无法在线转码时，会自动按原格式兜底下载。
- 本扩展不上传任何图片到服务器，全部处理在本地浏览器完成。
