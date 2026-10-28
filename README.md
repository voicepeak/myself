# 纪 · 个人站点

首页提供「我、作品、喜欢」三个主题，每个主题的字符点云和内容在同一页呈现。项目在原处展开，收藏按音乐与视觉小说分组，首页呈现正在探索、灵感收藏、碎片及联系与合作。页面使用原生滚动，旧项目和收藏链接仍指向对应内容。

点云形态与 `dist/motifs.html` 字符实验使用同一套渲染函数；缩略图是生成的字符意象，不是项目截图。项目摘要基于用户提供的资料，保留 Fork、模拟验收和研发中等说明。

- `dist/shallow.js` 与 `dist/shallow.css`：主题切换、页面内容与排版。
- `dist/explore-data.js`：主题、项目、收藏与链接。
- `dist/explore-field.js` 和 `dist/field/`：字符点云。
- `dist/about.html`：旧自述地址跳回首页。

运行 `npm run dev` 预览，`npm run check` 检查主题、项目和链接；`node verify-explore-render.mjs` 验证字符渲染。自动化检查不能替代真实浏览器的视觉与性能验收。

推送到 `main` 后，GitHub Actions 会将 `dist/` 自动部署到 GitHub Pages；也可在 Actions 页面手动运行部署工作流。
