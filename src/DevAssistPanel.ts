import * as vscode from "vscode";
import Anthropic from "@anthropic-ai/sdk";

type Message = { role: "user" | "assistant"; content: string };

export class DevAssistPanel {
  private static current: DevAssistPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private history: Message[] = [];
  private client: Anthropic | undefined;
  private disposables: vscode.Disposable[] = [];

  static show(extensionUri: vscode.Uri) {
    if (DevAssistPanel.current) {
      DevAssistPanel.current.panel.reveal(vscode.ViewColumn.Two);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      "devassist",
      "DevAssist",
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
        retainContextWhenHidden: true,
      }
    );
    DevAssistPanel.current = new DevAssistPanel(panel, extensionUri);
  }

  static sendQuery(code: string, language: string, prompt: string) {
    DevAssistPanel.current?._sendEditorQuery(code, language, prompt);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.panel.webview.html = this.getHtml();
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage(
      (msg) => this.handleMessage(msg),
      null,
      this.disposables
    );
  }

  private getClient(): Anthropic | null {
    const config = vscode.workspace.getConfiguration("devassist");
    const apiKey = config.get<string>("apiKey", "");
    if (!apiKey) {
      this.panel.webview.postMessage({
        type: "error",
        text: 'No API key configured. Go to Settings → search "DevAssist" → enter your Anthropic API key.',
      });
      vscode.commands.executeCommand("workbench.action.openSettings", "devassist.apiKey");
      return null;
    }
    if (!this.client || (this.client as any).apiKey !== apiKey) {
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  private async handleMessage(msg: { type: string; text?: string; code?: string; language?: string }) {
    if (msg.type === "ask") {
      await this.runQuery(msg.text ?? "", msg.code, msg.language);
    } else if (msg.type === "clear") {
      this.history = [];
    } else if (msg.type === "openSettings") {
      vscode.commands.executeCommand("workbench.action.openSettings", "devassist");
    }
  }

  private async _sendEditorQuery(code: string, language: string, prompt: string) {
    // Wait a tick for the webview to be ready
    await new Promise((r) => setTimeout(r, 300));
    this.panel.webview.postMessage({ type: "editorQuery", code, language, prompt });
    await this.runQuery(prompt, code, language);
  }

  private async runQuery(userText: string, code?: string, language?: string) {
    const client = this.getClient();
    if (!client) return;

    const config = vscode.workspace.getConfiguration("devassist");
    const model = config.get<string>("model", "claude-sonnet-4-6");
    const maxTokens = config.get<number>("maxTokens", 4096);

    let userContent = userText;
    if (code) {
      userContent = `\`\`\`${language ?? ""}\n${code}\n\`\`\`\n\n${userText}`;
    }

    this.history.push({ role: "user", content: userContent });
    this.panel.webview.postMessage({ type: "start" });

    try {
      let fullResponse = "";
      const stream = await client.messages.stream({
        model,
        max_tokens: maxTokens,
        system:
          "You are DevAssist, an expert programming assistant embedded in VS Code. " +
          "You help developers understand, debug, and improve their code. " +
          "Be concise and precise. Use markdown formatting. " +
          "When showing code, always use fenced code blocks with the language identifier.",
        messages: this.history,
      });

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          fullResponse += chunk.delta.text;
          this.panel.webview.postMessage({ type: "delta", text: chunk.delta.text });
        }
      }

      this.history.push({ role: "assistant", content: fullResponse });
      this.panel.webview.postMessage({ type: "done" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.panel.webview.postMessage({ type: "error", text: `API error: ${msg}` });
      // Remove the user message we just pushed since the request failed
      this.history.pop();
    }
  }

  private getHtml(): string {
    const webview = this.panel.webview;
    const mediaUri = (file: string) =>
      webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", file));

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<title>DevAssist</title>
<style>
  :root {
    --bg: var(--vscode-editor-background);
    --fg: var(--vscode-editor-foreground);
    --border: var(--vscode-panel-border);
    --input-bg: var(--vscode-input-background);
    --input-fg: var(--vscode-input-foreground);
    --input-border: var(--vscode-input-border);
    --btn-bg: var(--vscode-button-background);
    --btn-fg: var(--vscode-button-foreground);
    --btn-hover: var(--vscode-button-hoverBackground);
    --code-bg: var(--vscode-textCodeBlock-background);
    --accent: var(--vscode-textLink-foreground);
    --user-bubble: var(--vscode-badge-background);
    --error: var(--vscode-inputValidation-errorBackground);
    --error-fg: var(--vscode-inputValidation-errorForeground);
    --font-mono: var(--vscode-editor-font-family, 'Courier New', monospace);
    --font-size: var(--vscode-editor-font-size, 13px);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: var(--vscode-font-family, system-ui, sans-serif);
    font-size: var(--vscode-font-size, 13px);
    color: var(--fg);
    background: var(--bg);
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  /* ── Header ── */
  #header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  #header h1 { font-size: 14px; font-weight: 600; letter-spacing: 0.03em; }
  #header-actions { display: flex; gap: 6px; }
  .icon-btn {
    background: none;
    border: none;
    color: var(--fg);
    cursor: pointer;
    padding: 4px 6px;
    border-radius: 4px;
    font-size: 12px;
    opacity: 0.7;
    display: flex; align-items: center; gap: 4px;
  }
  .icon-btn:hover { opacity: 1; background: var(--vscode-toolbar-hoverBackground); }

  /* ── Code preview ── */
  #code-preview {
    display: none;
    background: var(--code-bg);
    border-bottom: 1px solid var(--border);
    padding: 8px 12px;
    flex-shrink: 0;
    max-height: 120px;
    overflow-y: auto;
    position: relative;
  }
  #code-preview.visible { display: block; }
  #code-preview pre {
    font-family: var(--font-mono);
    font-size: 11px;
    white-space: pre-wrap;
    word-break: break-all;
    color: var(--fg);
    opacity: 0.85;
  }
  #code-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.5;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  #clear-code {
    cursor: pointer;
    opacity: 0.6;
    font-size: 14px;
    line-height: 1;
    background: none;
    border: none;
    color: var(--fg);
    padding: 0 2px;
  }
  #clear-code:hover { opacity: 1; }

  /* ── Messages ── */
  #messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  #empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    opacity: 0.5;
    text-align: center;
  }
  #empty-state .logo { font-size: 32px; }
  #empty-state p { font-size: 12px; max-width: 200px; line-height: 1.5; }

  .message { display: flex; flex-direction: column; gap: 4px; }
  .message-role {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.5;
  }
  .message.user .message-role { color: var(--accent); }
  .message-body {
    line-height: 1.6;
    font-size: 13px;
  }

  /* Markdown rendering */
  .message-body h1, .message-body h2, .message-body h3 {
    font-weight: 600;
    margin: 12px 0 6px;
    line-height: 1.3;
  }
  .message-body h1 { font-size: 16px; }
  .message-body h2 { font-size: 14px; }
  .message-body h3 { font-size: 13px; }
  .message-body p { margin: 6px 0; }
  .message-body ul, .message-body ol { padding-left: 20px; margin: 6px 0; }
  .message-body li { margin: 3px 0; }
  .message-body code {
    font-family: var(--font-mono);
    font-size: 0.9em;
    background: var(--code-bg);
    padding: 1px 5px;
    border-radius: 3px;
  }
  .message-body pre {
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 12px;
    overflow-x: auto;
    margin: 8px 0;
    position: relative;
  }
  .message-body pre code {
    background: none;
    padding: 0;
    font-size: var(--font-size);
    line-height: 1.5;
  }
  .copy-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    font-size: 11px;
    padding: 2px 8px;
    background: var(--btn-bg);
    color: var(--btn-fg);
    border: none;
    border-radius: 3px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.1s;
  }
  pre:hover .copy-btn { opacity: 1; }
  .copy-btn:hover { background: var(--btn-hover); }

  .message-body strong { font-weight: 600; }
  .message-body em { font-style: italic; }
  .message-body blockquote {
    border-left: 3px solid var(--accent);
    padding-left: 10px;
    opacity: 0.8;
    margin: 6px 0;
  }
  .message-body hr { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
  .message-body a { color: var(--accent); }

  /* Streaming cursor */
  .cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: var(--accent);
    margin-left: 1px;
    vertical-align: text-bottom;
    animation: blink 0.8s step-end infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }

  /* Error */
  .error-msg {
    background: var(--error, #5a1d1d);
    color: var(--error-fg, #f48771);
    border-radius: 6px;
    padding: 10px 12px;
    font-size: 12px;
    line-height: 1.5;
  }

  /* ── Input area ── */
  #input-area {
    border-top: 1px solid var(--border);
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
  }
  #question {
    background: var(--input-bg);
    color: var(--input-fg);
    border: 1px solid var(--input-border, transparent);
    border-radius: 6px;
    padding: 8px 10px;
    font-family: inherit;
    font-size: 13px;
    resize: none;
    min-height: 60px;
    max-height: 160px;
    outline: none;
    width: 100%;
    line-height: 1.5;
  }
  #question:focus { border-color: var(--accent); }
  #bottom-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  #model-label {
    font-size: 11px;
    opacity: 0.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
  #actions { display: flex; gap: 6px; align-items: center; }
  #hint { font-size: 11px; opacity: 0.35; }
  #submit {
    background: var(--btn-bg);
    color: var(--btn-fg);
    border: none;
    border-radius: 4px;
    padding: 5px 14px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
  }
  #submit:hover:not(:disabled) { background: var(--btn-hover); }
  #submit:disabled { opacity: 0.4; cursor: not-allowed; }
  .spinner { display: inline-block; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div id="header">
  <h1>⚡ DevAssist</h1>
  <div id="header-actions">
    <button class="icon-btn" id="btn-settings" title="Settings">⚙ Settings</button>
    <button class="icon-btn" id="btn-clear" title="Clear conversation">✕ Clear</button>
  </div>
</div>

<div id="code-preview">
  <div id="code-label">
    <span id="code-lang-badge">Code</span>
    <button id="clear-code" title="Remove code context">✕</button>
  </div>
  <pre id="code-content"></pre>
</div>

<div id="messages">
  <div id="empty-state">
    <div class="logo">⚡</div>
    <p>Ask a question or select code in your editor and use a DevAssist command.</p>
  </div>
</div>

<div id="input-area">
  <textarea id="question" placeholder="Ask anything about your code… (Enter to send, Shift+Enter for newline)" rows="3"></textarea>
  <div id="bottom-row">
    <span id="model-label">Loading model…</span>
    <div id="actions">
      <span id="hint">↵ send</span>
      <button id="submit">Send</button>
    </div>
  </div>
</div>

<script>
const vscode = acquireVsCodeApi();
const messagesEl = document.getElementById('messages');
const emptyState = document.getElementById('empty-state');
const questionEl = document.getElementById('question');
const submitBtn = document.getElementById('submit');
const modelLabel = document.getElementById('model-label');
const codePreview = document.getElementById('code-preview');
const codeContent = document.getElementById('code-content');
const codeLangBadge = document.getElementById('code-lang-badge');

let pendingCode = '';
let pendingLang = '';
let streaming = false;
let streamEl = null;
let streamRaw = '';

// ── Utilities ──

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderMarkdown(md) {
  let html = escapeHtml(md);
  // fenced code blocks
  html = html.replace(/\`\`\`(\w*)\n?([\s\S]*?)\`\`\`/g, (_, lang, code) => {
    const id = 'cb' + Math.random().toString(36).slice(2,8);
    return \`<pre><code class="lang-\${lang}">\${code.trimEnd()}</code><button class="copy-btn" onclick="copyCode('\${id}',this)">Copy</button></pre>\`;
  });
  // inline code
  html = html.replace(/\`([^\`\n]+)\`/g, '<code>$1</code>');
  // bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  // hr
  html = html.replace(/^---$/gm, '<hr>');
  // unordered list
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  // ordered list
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  // paragraphs (blank line separated)
  html = html.replace(/\n\n+/g, '</p><p>');
  html = '<p>' + html + '</p>';
  // clean up p tags around block elements
  html = html.replace(/<p>(<(?:h[1-3]|ul|ol|pre|hr|blockquote)[^>]*>)/g, '$1');
  html = html.replace(/(<\/(?:h[1-3]|ul|ol|pre|hr|blockquote)>)<\/p>/g, '$1');
  html = html.replace(/<p><\/p>/g, '');
  return html;
}

function copyCode(id, btn) {
  const pre = btn.closest('pre');
  const code = pre.querySelector('code');
  navigator.clipboard.writeText(code.textContent).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 1500);
  });
}

function appendMessage(role, content, isError = false) {
  if (emptyState) emptyState.style.display = 'none';
  const div = document.createElement('div');
  div.className = 'message ' + role;
  const roleEl = document.createElement('div');
  roleEl.className = 'message-role';
  roleEl.textContent = role === 'user' ? 'You' : 'DevAssist';
  const bodyEl = document.createElement('div');
  bodyEl.className = isError ? 'error-msg' : 'message-body';
  if (isError) {
    bodyEl.textContent = content;
  } else {
    bodyEl.innerHTML = role === 'user' ? '<p>' + escapeHtml(content) + '</p>' : renderMarkdown(content);
  }
  div.appendChild(roleEl);
  div.appendChild(bodyEl);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bodyEl;
}

function setStreaming(on) {
  streaming = on;
  submitBtn.disabled = on;
  submitBtn.textContent = on ? '…' : 'Send';
}

// ── Code preview ──

function setCode(code, lang) {
  pendingCode = code;
  pendingLang = lang;
  if (code) {
    const preview = code.length > 400 ? code.slice(0, 400) + '…' : code;
    codeContent.textContent = preview;
    codeLangBadge.textContent = lang || 'code';
    codePreview.classList.add('visible');
  } else {
    codePreview.classList.remove('visible');
  }
}

document.getElementById('clear-code').addEventListener('click', () => setCode('', ''));

// ── Submit ──

function submit() {
  const text = questionEl.value.trim();
  if (!text || streaming) return;
  questionEl.value = '';
  questionEl.style.height = 'auto';

  // Build display text for user bubble
  let displayText = text;
  if (pendingCode) {
    displayText = '[Code: ' + (pendingLang || 'snippet') + ']\n' + text;
  }
  appendMessage('user', displayText);

  vscode.postMessage({ type: 'ask', text, code: pendingCode || undefined, language: pendingLang || undefined });
  setCode('', '');
}

submitBtn.addEventListener('click', submit);
questionEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submit();
  }
});
questionEl.addEventListener('input', () => {
  questionEl.style.height = 'auto';
  questionEl.style.height = Math.min(questionEl.scrollHeight, 160) + 'px';
});

document.getElementById('btn-clear').addEventListener('click', () => {
  messagesEl.innerHTML = '';
  messagesEl.appendChild(emptyState);
  emptyState.style.display = '';
  vscode.postMessage({ type: 'clear' });
  setCode('', '');
});

document.getElementById('btn-settings').addEventListener('click', () => {
  vscode.postMessage({ type: 'openSettings' });
});

// ── Messages from extension ──

window.addEventListener('message', e => {
  const msg = e.data;
  switch (msg.type) {
    case 'editorQuery': {
      setCode(msg.code, msg.language);
      questionEl.value = msg.prompt;
      break;
    }
    case 'start': {
      setStreaming(true);
      streamRaw = '';
      const bodyEl = document.createElement('div');
      bodyEl.className = 'message-body';
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      bodyEl.appendChild(cursor);
      const div = document.createElement('div');
      div.className = 'message assistant';
      const roleEl = document.createElement('div');
      roleEl.className = 'message-role';
      roleEl.textContent = 'DevAssist';
      div.appendChild(roleEl);
      div.appendChild(bodyEl);
      messagesEl.appendChild(div);
      if (emptyState) emptyState.style.display = 'none';
      streamEl = bodyEl;
      messagesEl.scrollTop = messagesEl.scrollHeight;
      break;
    }
    case 'delta': {
      streamRaw += msg.text;
      if (streamEl) {
        streamEl.innerHTML = renderMarkdown(streamRaw) + '<span class="cursor"></span>';
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
      break;
    }
    case 'done': {
      if (streamEl) {
        streamEl.innerHTML = renderMarkdown(streamRaw);
        streamEl = null;
      }
      streamRaw = '';
      setStreaming(false);
      break;
    }
    case 'error': {
      if (streamEl) { streamEl.remove(); streamEl = null; }
      streamRaw = '';
      setStreaming(false);
      appendMessage('assistant', msg.text, true);
      break;
    }
    case 'modelInfo': {
      modelLabel.textContent = msg.model;
      break;
    }
  }
});

// Ask extension for model info on load
vscode.postMessage({ type: 'getModel' });
setTimeout(() => {
  const config = window.__config;
  if (!config) {
    // Fetch from extension via message — handled above
  }
}, 0);
</script>
</body>
</html>`;
  }

  private dispose() {
    DevAssistPanel.current = undefined;
    this.panel.dispose();
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
  }
}
