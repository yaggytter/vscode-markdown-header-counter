import * as vscode from 'vscode';

interface HeaderInfo {
    text: string;
    cleanText: string;
    level: number;
    headerCharacters: number;
    contentCharacters: number;
    lineNumber: number;
    endLineNumber: number | null;
    content: string;
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('markdown-counter.countHeaders', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Please open an editor');
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'markdown') {
            vscode.window.showInformationMessage('Please open a Markdown file');
            return;
        }

        const text = document.getText();
        const lines = text.split('\n');
        const headers: HeaderInfo[] = [];

        // Remove markdown decorations from text
        function removeMarkdownDecorations(text: string): string {
            return text
                .replace(/(\*\*|__)(.*?)\1/g, '$2')
                .replace(/(\*|_)(.*?)\1/g, '$2')
                .replace(/`(.*?)`/g, '$1')
                .replace(/\[(.*?)\]\(.*?\)/g, '$1')
                .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
                .replace(/<!--.*?-->/g, ''); // Remove HTML comments
        }

        // Check if line is a header
        function isHeader(line: string): { isHeader: boolean; level: number; text: string } {
            const headerMatch = line.trim().match(/^(#{1,6})\s(.+)/);
            if (headerMatch) {
                return {
                    isHeader: true,
                    level: headerMatch[1].length,
                    text: headerMatch[2].trim()
                };
            }
            return { isHeader: false, level: 0, text: '' };
        }

        // Count characters in content
        function countContentCharacters(content: string): number {
            const cleanContent = removeMarkdownDecorations(content);
            return cleanContent
                .split('\n')
                .filter(line => line.trim().length > 0)
                .join('')
                .length;
        }

        // Parse headers and their content
        for (let i = 0; i < lines.length; i++) {
            const headerCheck = isHeader(lines[i]);
            if (headerCheck.isHeader) {
                const headerText = headerCheck.text;
                const level = headerCheck.level;
                const cleanHeaderText = removeMarkdownDecorations(headerText);
                let contentLines: string[] = [];
                let endLineNumber: number | null = null;

                // Collect content until next header of same or higher level
                let j = i + 1;
                while (j < lines.length) {
                    const nextLineHeaderCheck = isHeader(lines[j]);
                    if (nextLineHeaderCheck.isHeader && nextLineHeaderCheck.level <= level) {
                        endLineNumber = j - 1;
                        break;
                    }
                    contentLines.push(lines[j]);
                    j++;
                }

                if (endLineNumber === null) {
                    endLineNumber = lines.length - 1;
                }

                const content = contentLines.join('\n');
                headers.push({
                    text: headerText,
                    cleanText: cleanHeaderText,
                    level: level,
                    headerCharacters: cleanHeaderText.length,
                    contentCharacters: countContentCharacters(content),
                    lineNumber: i + 1,
                    endLineNumber: endLineNumber,
                    content: content
                });
            }
        }

        // Create WebView panel for results
        const panel = vscode.window.createWebviewPanel(
            'markdownHeaderCount',
            'Markdown Header Count',
            vscode.ViewColumn.One,
            {}
        );

        // Display results in HTML format

        panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    :root {
                        color-scheme: light dark;
                    }

                    body { 
                        font-family: system-ui, -apple-system, sans-serif; 
                        padding: 20px; 
                        line-height: 1.5;
                        background: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }

                    table { 
                        border-collapse: collapse; 
                        width: 100%; 
                        margin-bottom: 20px;
                        table-layout: fixed;
                        background: var(--vscode-editor-background);
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        border-radius: 6px;
                        overflow: hidden;
                    }

                    th, td { 
                        padding: 12px 16px;
                        text-align: left;
                        vertical-align: top;
                        border: 1px solid var(--vscode-panel-border);
                    }

                    th { 
                        background: var(--vscode-titleBar-activeBackground);
                        color: var(--vscode-titleBar-activeForeground);
                        font-weight: 500;
                        text-transform: uppercase;
                        font-size: 0.9em;
                        letter-spacing: 0.5px;
                    }

                    tr { 
                        background: var(--vscode-editor-background);
                        transition: background-color 0.2s ease;
                    }

                    tr:nth-child(even) { 
                        background: var(--vscode-list-activeSelectionBackground, rgba(128, 128, 128, 0.05));
                    }

                    tr:hover { 
                        background: var(--vscode-list-hoverBackground);
                    }

                    .header-cell { 
                        word-break: break-all;
                        color: var(--vscode-editor-foreground);
                    }

                    .info { 
                        margin-bottom: 20px;
                        padding: 16px;
                        background: var(--vscode-textBlockQuote-background);
                        border-left: 4px solid var(--vscode-textLink-activeForeground);
                        border-radius: 4px;
                    }

                    .line-number {
                        width: 120px;
                        color: var(--vscode-descriptionForeground);
                        font-family: var(--vscode-editor-font-family);
                        font-size: 0.9em;
                    }

                    .character-count {
                        width: 120px;
                        text-align: right;
                        font-family: var(--vscode-editor-font-family);
                        font-variant-numeric: tabular-nums;
                    }

                    .content-preview {
                        color: var(--vscode-descriptionForeground);
                        font-size: 0.9em;
                        margin-top: 8px;
                        max-height: 3em;
                        overflow: hidden;
                        opacity: 0.8;
                    }

                    .indent-header {
                        padding-left: calc(var(--level) * 20px);
                        font-weight: 500;
                        color: var(--vscode-editor-foreground);
                    }

                    h3 {
                        color: var(--vscode-titleBar-activeForeground);
                        margin-top: 0;
                    }

                    .stats {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 16px;
                        margin-top: 24px;
                    }

                    .stat-card {
                        background: var(--vscode-textBlockQuote-background);
                        padding: 16px;
                        border-radius: 4px;
                        text-align: center;
                    }

                    .stat-value {
                        font-size: 1.5em;
                        font-weight: 500;
                        color: var(--vscode-textLink-activeForeground);
                        margin: 8px 0;
                    }

                    .stat-label {
                        color: var(--vscode-descriptionForeground);
                        font-size: 0.9em;
                    }
                </style>
            </head>
            <body>
                <div class="info">
                    <h3>Counting Method</h3>
                    <p>- Header characters: Excluding decorative characters</p>
                    <p>- Content characters: From below the header to the next header of same or higher level (excluding empty lines)</p>
                </div>

                <table>
                    <tr>
                        <th class="line-number">Line Numbers</th>
                        <th>Header</th>
                        <th class="character-count">Header Count</th>
                        <th class="character-count">Content Count</th>
                    </tr>
                    ${headers.map(header => `
                        <tr>
                            <td class="line-number">Lines ${header.lineNumber}-${header.endLineNumber}</td>
                            <td class="header-cell">
                                <div class="indent-header" style="--level: ${header.level - 1}">
                                    ${'#'.repeat(header.level)} ${header.text}
                                </div>
                                <div class="content-preview">
                                    ${header.content.split('\n').slice(0, 2).join(' ').substring(0, 100)}
                                    ${header.content.length > 100 ? '...' : ''}
                                </div>
                            </td>
                            <td class="character-count">${header.headerCharacters} chars</td>
                            <td class="character-count">${header.contentCharacters} chars</td>
                        </tr>
                    `).join('')}
                </table>

                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-label">Total Headers</div>
                        <div class="stat-value">${headers.length}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total Header Characters</div>
                        <div class="stat-value">${headers.reduce((sum, header) => sum + header.headerCharacters, 0)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total Content Characters</div>
                        <div class="stat-value">${headers.reduce((sum, header) => sum + header.contentCharacters, 0)}</div>
                    </div>
                </div>
            </body>
            </html>
        `;
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}