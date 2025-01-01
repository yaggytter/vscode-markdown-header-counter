# Markdown Header Counter

A Visual Studio Code extension that counts characters in Markdown headers and their associated content sections. This extension helps you understand the structure and length of your Markdown documents by providing detailed character counts for each section.

## Features

- Counts characters in headers (excluding Markdown decorations)
- Counts characters in content under each header
- Shows line numbers for each section
- Provides content previews
- Supports nested headers
- Works with both light and dark VS Code themes
- Real-time analysis of Markdown documents

## Usage

1. Open a Markdown file
2. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
3. Type "Count Markdown Headers" and select the command
4. A new panel will open showing the analysis results

## Analysis Details

The extension provides the following information for each header:

- **Line Numbers**: Shows where each section begins and ends
- **Header Text**: The full header text with proper indentation based on level
- **Header Character Count**: Number of characters in the header (excluding Markdown syntax)
- **Content Character Count**: Number of characters in the content below the header

### Counting Method

- Header characters are counted after removing Markdown decorations (**, __, *, _, `)
- Content is counted from below the header until the next header of the same or higher level
- Empty lines are excluded from the character count
- HTML comments are excluded from the count

## Examples

```markdown
# Main Header (10 characters)
Some content under the main header.
More content here.

## Sub Header (10 characters)
Content under the sub header.
```

The extension will count characters in both headers and their respective content sections separately.

## Requirements

- Visual Studio Code version 1.85.0 or higher
- Markdown files (`.md` extension)

## Extension Settings

This extension does not add any VS Code settings.

## Known Issues

None at this time. Please report any issues you find on our GitHub repository.

## Release Notes

### 1.0.0

Initial release of Markdown Header Counter:
- Basic header and content character counting
- Section preview

## License

This extension is licensed under the [MIT License](LICENSE).

## Privacy

This extension does not collect or transmit any user data. All analysis is performed locally within VS Code.

