# DevAssist — AI Coding Assistant

A sleek, modern web-based IDE-style interface for analyzing, debugging, and optimizing your code with AI assistance. Paste code, ask questions, get instant feedback.

![DevAssist Demo](https://img.shields.io/badge/status-demo-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

- **Dual-panel interface** — Code editor on the left, AI responses on the right
- **Multi-language support** — Python, JavaScript, TypeScript, Java, C++, Go, SQL
- **File upload** — Drag or upload `.py`, `.js`, `.ts`, `.java`, `.go`, `.sql` files
- **Live code analysis** — Ask about bugs, performance, explanations
- **Syntax highlighting** — Markdown rendering with code blocks and inline code
- **Dark/Light theme** — Toggle between dark and light modes
- **Conversation history** — Track all questions and responses in one session
- **Export to Markdown** — Download your entire conversation as `.md`
- **Token counter** — Real-time estimate of your code's token usage
- **Responsive design** — Works on desktop and tablet

---

## 🚀 Quick Start

### Option 1: Open Directly
1. Clone or download this repository
2. Open `index.html` in your browser
3. Paste code and start asking questions

### Option 2: Serve Locally
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server
```
Then navigate to `http://localhost:8000`

---

## 📖 Usage

### Basic Workflow

1. **Paste code** into the left editor panel
2. **Select language** from the dropdown (auto-detected on file upload)
3. **Ask a question** in the input bar
4. **Press Enter** or click **Ask ↗** to submit
5. **Read the response** in the right panel

### Example Questions

- *"Find any bugs or issues in this code"*
- *"Explain what this code does, step by step"*
- *"How can I optimize this for better performance?"*
- *"What's wrong with my function?"*

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Submit question (in question box) |
| `Shift + Enter` | New line in question box |
| `Ctrl + Enter` / `Cmd + Enter` | Submit from anywhere |

### Buttons & Controls

| Control | Purpose |
|---------|---------|
| **↑ Upload file** | Load a code file from your computer |
| **Language dropdown** | Set the code language (auto-detected on upload) |
| **Line counter** | Shows current line count |
| **Token counter** | Estimates token usage (~4 chars = 1 token) |
| **⧉ Copy** | Copy last AI response to clipboard |
| **↓ Export** | Download conversation as Markdown file |
| **Clear** | Erase all messages and reset stats |
| **☀ Light / 🌙 Dark** | Toggle theme |

---

## 🎨 Design & Architecture

### UI Structure

```
┌─────────────────────────────────────────────────┐
│  DevAssist  AI                      ☀ Light     │ Header
├──────────────────────┬──────────────────────────┤
│ Code Editor          │ Response                 │
│ ┌──────────────────┐ │ ┌────────────────────┐  │
│ │ Code Input       │ │ │ Chat Messages      │  │
│ │                  │ │ │ (User & DevAssist) │  │
│ │                  │ │ │                    │  │
│ ├──────────────────┤ │ └────────────────────┘  │
│ │ Question Input   │ │ ┌────────────────────┐  │
│ │ [Ask ↗]          │ │ │ Stats Bar          │  │
│ └──────────────────┘ │ └────────────────────┘  │
└──────────────────────┴──────────────────────────┘
```

### Key Components

- **Header** — Logo, theme toggle, demo badge
- **Left Panel** — Code editor + question input
- **Right Panel** — Response container + stats
- **Conversation Flow** — User message → AI response (streamed)

### Technology Stack

- **Frontend** — Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Styling** — CSS Variables for theming
- **Fonts** — JetBrains Mono (code), Syne (UI)
- **Rendering** — Markdown to HTML (custom parser)

---

## 🔧 How It Works

### Demo Mode
Currently, DevAssist runs in **demo mode** with pre-written responses that match the context of your code:

- **Bug detection** — Identifies common Python errors (off-by-one, mutable defaults, etc.)
- **Code explanation** — Describes what each function does
- **Performance tips** — Suggests optimizations with code examples

The routing logic checks question keywords:
```javascript
if (q.includes('bug') || q.includes('issue')) → return bug analysis
if (q.includes('explain') || q.includes('what')) → return explanation
if (q.includes('optim') || q.includes('faster')) → return performance tips
```

### Response Rendering

1. **Markdown parsing** — Converts markdown to HTML
2. **Code block extraction** — Wraps in styled `<pre>` blocks with copy button
3. **Inline formatting** — Bold (`**text**`), headings (`##`), lists, etc.
4. **Streaming effect** — Types response character-by-character for visual feedback

### Data Flow

```
User Input
    ↓
[Question + Code Context]
    ↓
Generate/Fetch Response
    ↓
Stream Text (char by char)
    ↓
Render Markdown → HTML
    ↓
Store in convHistory
    ↓
Update Stats
```

---

## 📁 File Structure

```
.
├── index.html          # Single-file web app (HTML + CSS + JS)
└── README.md           # This file
```

Yes, the entire app is in one HTML file for simplicity and easy deployment!

---

## 🎯 Future Enhancements

- [ ] **Real API integration** — Connect to Claude, GPT, or similar
- [ ] **Syntax highlighting** — Use Highlight.js for better code formatting
- [ ] **Line numbers** — Add line numbers to the code editor
- [ ] **Diff view** — Show before/after for refactoring suggestions
- [ ] **Multi-file support** — Upload and reference multiple files
- [ ] **Custom instructions** — Let users set AI behavior/tone
- [ ] **Save conversations** — Store sessions in localStorage
- [ ] **Collaborative mode** — Share sessions with teammates
- [ ] **Terminal integration** — Run code snippets in sandboxed environment

---

## 🧪 Demo Features

### Built-in Example Responses

The app includes demo responses for four buggy Python functions:

1. **find_duplicates()** — Off-by-one loop error
2. **process_batch()** — Mutable default argument bug
3. **calculate_average()** — ZeroDivisionError not handled
4. **search_user()** — Early return in loop

Try these example questions to see responses:
- "Find any bugs or issues in this code."
- "Explain what this code does, step by step."
- "How can I optimize this for better performance?"

---

## 🎨 Theming

### CSS Variables (Dark Mode)

```css
--bg: #0e1117;           /* Main background */
--bg-2: #161b22;         /* Secondary (header, panels) */
--bg-3: #1c2330;         /* Tertiary (input fields) */
--border: #30363d;       /* Border color */
--text: #e6edf3;         /* Primary text */
--text-muted: #8b949e;   /* Secondary text */
--text-dim: #484f58;     /* Tertiary text */
--accent: #3fb950;       /* Green accent (success/primary action) */
--blue: #58a6ff;         /* Blue (user messages) */
--red: #f85149;          /* Red (danger, delete) */
--yellow: #d29922;       /* Yellow (warning, inline code) */
```

### Switching Themes

Click **☀ Light** in the header to toggle to light mode. The app updates CSS variables dynamically.

---

## 🔒 Security

- **XSS Protection** — All user input is HTML-escaped before rendering
- **No Server Calls** — Currently runs entirely client-side (demo mode)
- **File Handling** — Files are read locally; nothing is uploaded
- **Token Estimation** — Rough calculation for awareness (not transmitted)

---

## 📝 License

MIT License — Feel free to use, modify, and distribute.

---

## 🤝 Contributing

Have ideas or found a bug? Feel free to:
1. Open an issue describing the problem
2. Submit a pull request with improvements
3. Suggest new features or demo responses

---

## 📞 Support

For questions or issues:
- Check the **Quick Start** section above
- Review the **Usage** guide for keyboard shortcuts
- Inspect browser console for any error messages (`F12`)

---

## 🎓 Learn More

### Markdown Support

DevAssist renders responses in markdown. Supported elements:

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**

`Inline code`

\`\`\`python
# Code block
print("Hello")
\`\`\`

- List item 1
- List item 2
```

### Code Block Copy

Every code block includes a **copy** button to quickly copy the code to your clipboard.

---

**Happy coding! 🚀**

Built with ❤️ for developers who want instant code feedback.
