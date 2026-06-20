import * as vscode from "vscode";
import { DevAssistPanel } from "./DevAssistPanel";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("devassist.open", () => {
      DevAssistPanel.show(context.extensionUri);
    }),

    vscode.commands.registerCommand("devassist.analyzeSelection", () => {
      const { code, language } = getEditorContext();
      DevAssistPanel.show(context.extensionUri);
      if (code) {
        DevAssistPanel.sendQuery(code, language, "Analyze this code and explain what it does, identify any issues, and suggest improvements.");
      }
    }),

    vscode.commands.registerCommand("devassist.explainCode", () => {
      const { code, language } = getEditorContext(true);
      DevAssistPanel.show(context.extensionUri);
      if (code) {
        DevAssistPanel.sendQuery(code, language, "Explain this code clearly. Describe what it does, how it works, and any important patterns or concepts used.");
      }
    }),

    vscode.commands.registerCommand("devassist.findBugs", () => {
      const { code, language } = getEditorContext(true);
      DevAssistPanel.show(context.extensionUri);
      if (code) {
        DevAssistPanel.sendQuery(code, language, "Find all bugs, errors, and potential issues in this code. For each problem, explain what's wrong and provide the corrected code.");
      }
    }),

    vscode.commands.registerCommand("devassist.optimizeCode", () => {
      const { code, language } = getEditorContext();
      DevAssistPanel.show(context.extensionUri);
      if (code) {
        DevAssistPanel.sendQuery(code, language, "Optimize this code for performance, readability, and best practices. Show the improved version with explanations of each change.");
      }
    })
  );
}

function getEditorContext(fallbackToFile = false): { code: string; language: string } {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return { code: "", language: "plaintext" };
  }
  const language = editor.document.languageId;
  const selection = editor.selection;
  if (!selection.isEmpty) {
    return { code: editor.document.getText(selection), language };
  }
  if (fallbackToFile) {
    return { code: editor.document.getText(), language };
  }
  vscode.window.showInformationMessage("DevAssist: Please select some code first.");
  return { code: "", language };
}

export function deactivate() {}
