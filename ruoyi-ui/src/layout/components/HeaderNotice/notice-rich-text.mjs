const QUILL_INDENT_STYLES = Array.from({ length: 9 }, (_, index) => {
  const level = index + 1;
  const contentPadding = level * 3;
  const listPadding = contentPadding + 1.5;
  return `
.notice-content .ql-indent-${level}:not(.ql-direction-rtl) { padding-left: ${contentPadding}em; }
.notice-content li.ql-indent-${level}:not(.ql-direction-rtl) { padding-left: ${listPadding}em; }
.notice-content .ql-indent-${level}.ql-direction-rtl { padding-right: ${contentPadding}em; }
.notice-content li.ql-indent-${level}.ql-direction-rtl { padding-right: ${listPadding}em; }`;
}).join('');

const NOTICE_DOCUMENT_STYLES = `
:root {
  color-scheme: light;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  --notice-background: #ffffff;
  --notice-content-color: #2d3748;
  --notice-title-color: #1a202c;
  --notice-meta-color: #718096;
  --notice-border-color: #e2e8f0;
  --notice-subtle-background: #f7fafc;
  --notice-link-color: #3182ce;
  --notice-inline-code-background: #edf2f7;
}

:root.dark {
  color-scheme: dark;
  --notice-background: #1d1e1f;
  --notice-content-color: #d0d0d0;
  --notice-title-color: #ffffff;
  --notice-meta-color: #b8bcc4;
  --notice-border-color: #434343;
  --notice-subtle-background: #141414;
  --notice-link-color: #79bbff;
  --notice-inline-code-background: #2d2f31;
}

* {
  box-sizing: border-box;
}

html,
body {
  min-height: 100%;
  margin: 0;
  background: var(--notice-background);
}

body {
  padding: 0;
  color: var(--notice-content-color);
  font-size: 14px;
  line-height: 1.85;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.notice-content p {
  margin: 0 0 1em;
}

.notice-content h1,
.notice-content h2,
.notice-content h3,
.notice-content h4,
.notice-content h5,
.notice-content h6 {
  margin: 1.4em 0 0.6em;
  color: var(--notice-title-color);
  font-weight: 700;
}

.notice-content h1 { font-size: 2em; }
.notice-content h2 { font-size: 1.5em; }
.notice-content h3 { font-size: 1.17em; }
.notice-content h4 { font-size: 1em; }
.notice-content h5 { font-size: 0.83em; }
.notice-content h6 { font-size: 0.67em; }

.notice-content a {
  color: var(--notice-link-color);
  text-decoration: underline;
}

.notice-content img,
.notice-content video,
.notice-content .ql-video {
  max-width: 100%;
  height: auto;
  margin: 8px 0;
  border-radius: 4px;
}

.notice-content .ql-video {
  display: block;
}

.notice-content ul,
.notice-content ol {
  margin: 0 0 1em;
  padding-left: 20px;
}

.notice-content li {
  margin-bottom: 4px;
}

.notice-content li[data-list] {
  position: relative;
  list-style: none;
  padding-left: 1.5em;
}

.notice-content li[data-list]::before {
  position: absolute;
  left: 0;
  width: 1.2em;
  text-align: right;
}

.notice-content ol {
  counter-reset: notice-list;
}

.notice-content li[data-list="ordered"] {
  counter-increment: notice-list;
}

.notice-content li[data-list="ordered"]::before {
  content: counter(notice-list) ". ";
}

.notice-content li[data-list="bullet"]::before { content: "•"; }
.notice-content li[data-list="checked"]::before { content: "☑"; }
.notice-content li[data-list="unchecked"]::before { content: "☐"; }
.notice-content .ql-ui { display: none; }

.notice-content blockquote {
  margin: 1em 0;
  padding: 6px 16px;
  border-left: 3px solid var(--notice-border-color);
  background: var(--notice-subtle-background);
  color: var(--notice-meta-color);
}

.notice-content table {
  width: 100%;
  margin: 1em 0;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
}

.notice-content table th,
.notice-content table td {
  padding: 7px 12px;
  border: 1px solid var(--notice-border-color);
}

.notice-content table th {
  background: var(--notice-subtle-background);
  font-weight: 600;
}

.notice-content .ql-direction-rtl {
  direction: rtl;
  text-align: inherit;
}

.notice-content .ql-align-center { text-align: center; }
.notice-content .ql-align-justify { text-align: justify; }
.notice-content .ql-align-right { text-align: right; }
.notice-content .ql-font-serif { font-family: Georgia, "Times New Roman", serif; }
.notice-content .ql-font-monospace { font-family: Monaco, "Courier New", monospace; }
.notice-content .ql-size-small { font-size: 0.75em; }
.notice-content .ql-size-large { font-size: 1.5em; }
.notice-content .ql-size-huge { font-size: 2.5em; }
.notice-content .ql-video.ql-align-center { margin-right: auto; margin-left: auto; }
.notice-content .ql-video.ql-align-right { margin-right: 0; margin-left: auto; }

.notice-content code {
  padding: 2px 4px;
  border-radius: 3px;
  background: var(--notice-inline-code-background);
  font-family: Monaco, "Courier New", monospace;
  font-size: 0.85em;
}

.notice-content .ql-code-block-container {
  margin: 5px 0;
  padding: 8px 10px;
  border-radius: 3px;
  background: #23241f;
  color: #f8f8f2;
  font-family: Monaco, "Courier New", monospace;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
}

.notice-content .ql-bg-black { background-color: #000000; }
.notice-content .ql-bg-red { background-color: #e60000; }
.notice-content .ql-bg-orange { background-color: #ff9900; }
.notice-content .ql-bg-yellow { background-color: #ffff00; }
.notice-content .ql-bg-green { background-color: #008a00; }
.notice-content .ql-bg-blue { background-color: #0066cc; }
.notice-content .ql-bg-purple { background-color: #9933ff; }
.notice-content .ql-color-white { color: #ffffff; }
.notice-content .ql-color-red { color: #e60000; }
.notice-content .ql-color-orange { color: #ff9900; }
.notice-content .ql-color-yellow { color: #ffff00; }
.notice-content .ql-color-green { color: #008a00; }
.notice-content .ql-color-blue { color: #0066cc; }
.notice-content .ql-color-purple { color: #9933ff; }
${QUILL_INDENT_STYLES}
`;

function normalizeApplicationOrigin(applicationOrigin) {
  if (applicationOrigin == null || String(applicationOrigin).trim() === '') {
    return '';
  }
  try {
    const url = new URL(String(applicationOrigin));
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }
    return url.origin;
  } catch {
    return '';
  }
}

function normalizeColorScheme(options) {
  return options && options.colorScheme === 'dark' ? 'dark' : 'light';
}

export function buildNoticeContentSecurityPolicy(applicationOrigin = '') {
  const mediaSources = ['data:', 'blob:'];
  const normalizedOrigin = normalizeApplicationOrigin(applicationOrigin);
  if (normalizedOrigin) {
    mediaSources.push(normalizedOrigin);
  }
  const mediaSourceList = mediaSources.join(' ');

  return [
    "default-src 'none'",
    "base-uri 'none'",
    "script-src 'none'",
    "connect-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "child-src 'none'",
    "form-action 'none'",
    "style-src 'unsafe-inline'",
    `img-src ${mediaSourceList}`,
    `media-src ${mediaSourceList}`
  ].join('; ');
}

export const NOTICE_CONTENT_SECURITY_POLICY = buildNoticeContentSecurityPolicy();

export function buildNoticeDocument(content, applicationOrigin = '', options = {}) {
  const richText = content == null ? '' : String(content);
  const contentSecurityPolicy = buildNoticeContentSecurityPolicy(applicationOrigin);
  const colorScheme = normalizeColorScheme(options);

  return '<!doctype html>'
    + `<html lang="zh-CN" class="${colorScheme}" data-color-scheme="${colorScheme}"><head><meta charset="utf-8">`
    + `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">`
    + '<meta name="referrer" content="no-referrer">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + `<style>${NOTICE_DOCUMENT_STYLES}</style>`
    + '</head><body><main class="notice-content">'
    + richText
    + '</main></body></html>';
}
