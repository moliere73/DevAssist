# DevAssist

AI-powered code assistant for VS Code — explain, debug, and optimize code without leaving your editor.

Powered by [Claude](https://www.anthropic.com) (Anthropic).

---

## Features

- **Streaming responses** — See Claude's answer appear token-by-token in real time
- **Editor integration** — Right-click any selection to analyze, explain, or find bugs
- **Conversation memory** — Multi-turn chat; Claude remembers your earlier questions
- **Markdown rendering** — Responses render with syntax-highlighted code blocks and copy buttons
- **Model choice** — Swap between Haiku, Sonnet, and Opus in settings
- **VS Code theming** — Panel inherits your editor colors automatically

---

## Requirements

- VS Code 1.85 or later
- An [Anthropic API key](https://console.anthropic.com)

---

## Installation

### From source

```bash
git clone https://github.com/moliere73/DevAssist.git
cd DevAssist
npm install
npm run build
```

Then open the folder in VS Code and press **F5** to launch an Extension Development Host.

---

## Setup

1. Open VS Code Settings (`Ctrl+,` / `Cmd+,`)
2. Search **DevAssist**
3. Paste your Anthropic API key into **DevAssist: Api Key**

---

## Commands

| Command | Shortcut | Description |
|---|---|---|
| **DevAssist: Open Panel** | `Ctrl+Shift+A` / `Cmd+Shift+A` | Open the chat panel |
| **DevAssist: Analyze Selection** | `Ctrl+Shift+D` / `Cmd+Shift+D` | Analyze selected code |
| **DevAssist: Explain Code** | — | Explain selected code (falls back to whole file) |
| **DevAssist: Find Bugs** | — | Find bugs in selected code or whole file |
| **DevAssist: Optimize Code** | — | Optimize selected code |

All commands also appear in the **right-click context menu** when editing code.

---

## Settings

| Setting | Default | Description |
|---|---|---|
| `devassist.apiKey` | `""` | Your Anthropic API key |
| `devassist.model` | `claude-sonnet-4-6` | Model to use (`claude-haiku-4-5-20251001`, `claude-sonnet-4-6`, `claude-opus-4-8`) |
| `devassist.maxTokens` | `4096` | Maximum tokens per response (256–16000) |

---

## Usage

**From the editor:**
1. Select some code
2. Right-click → choose a DevAssist action, or use a keyboard shortcut
3. The panel opens and the response streams in

**From the panel:**
1. Open with `Ctrl+Shift+A`
2. Type a question in the text box and press **Enter**
3. Optionally paste code directly into your question

---

## Project Structure

```
DevAssist/
├── src/
│   ├── extension.ts       # Command registration and editor context
│   └── DevAssistPanel.ts  # Webview panel, streaming, Claude API client
├── out/
│   └── extension.js       # Bundled output (esbuild)
├── devassist.html         # Original standalone web prototype
├── demo.py                # Sample buggy Python for testing
├── package.json           # Extension manifest
└── tsconfig.json
```

---

## Development

```bash
npm run watch    # Rebuild on file changes (with source maps)
npm run build    # Production bundle
npm run compile  # Type-check only (no output)
```

Press **F5** in VS Code to open the Extension Development Host with the extension loaded.

---

## License

MIT
