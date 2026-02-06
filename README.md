# 🚀 Terminal Drag & Drop Path

An Obsidian plugin that lets you drag files and folders directly into your terminal and automatically paste their paths—no more manual typing, no more copy-paste friction.

## Features

- **Explorer Drag & Drop**: Drag files/folders from the Obsidian file explorer directly into the terminal to paste their vault-relative path
- **Finder/File Manager Drag & Drop**: Drag files from macOS Finder (or other OS file managers) into the terminal to paste their absolute filesystem path
- **Smart Shell Escaping**: Paths with spaces, quotes, and other special characters are automatically escaped with single quotes for safe terminal usage
- **Intelligent Fallback**: If direct paste fails, the path is copied to your clipboard with a helpful notification
- **Visual Feedback**: Terminal highlights with a colored outline when you drag over it, showing that drops are accepted
- **Granular Control**: Toggle Explorer and Finder drag-drop support independently in settings

## Installation

### Manual Install

1. Download the latest release files: `main.js`, `manifest.json`, and `styles.css`
2. Navigate to your Obsidian vault's plugin directory:
   ```
   .obsidian/plugins/terminal-dnd-path/
   ```
3. Create the directory if it doesn't exist
4. Place the three files into this directory
5. In Obsidian, open Settings → Community plugins → Reload plugins
6. Enable "Terminal Drag & Drop Path" under installed plugins

## Usage

### Dragging from Obsidian Explorer

1. Open your terminal pane in Obsidian (requires a terminal plugin like [obsidian-terminal](https://github.com/polyipseity/obsidian-terminal))
2. In the file explorer sidebar, drag any file or folder
3. While dragging, hover over the terminal—it will highlight with a colored outline
4. Drop the file/folder into the terminal
5. The vault-relative path will be automatically pasted into your terminal

**Example**: Dragging a file at `docs/notes/my-file.md` from the explorer will paste:
```
docs/notes/my-file.md
```

### Dragging from Finder or File Manager

1. Open your terminal pane in Obsidian
2. In macOS Finder (or your system's file manager), drag any file or folder
3. While dragging, hover over the terminal—it will highlight
4. Drop the file/folder into the terminal
5. The absolute filesystem path will be automatically pasted, shell-escaped for safety

**Example**: Dragging `/Users/username/Downloads/data.csv` will paste:
```
'/Users/username/Downloads/data.csv'
```

### Shell Escaping

Paths with special characters are automatically wrapped in single quotes and properly escaped:

- `file with spaces.txt` → `'file with spaces.txt'`
- `file's name.md` → `'file'\''s name.md'`
- `path/to/file(1).txt` → `'path/to/file(1).txt'`

This ensures your paths work correctly in all shell commands.

### Fallback Behavior

If direct paste into the terminal fails (rare), the path is copied to your clipboard and you'll see a notification:
```
Path copied to clipboard. Press Cmd+V to paste: /path/to/file
```

Simply press `Cmd+V` (or `Ctrl+V` on Linux) to paste the path manually.

## Settings

Access settings in Obsidian under **Settings → Community plugins → Terminal Drag & Drop Path**:

### Explorer drag & drop
Toggle drag-drop support for files/folders dragged from the Obsidian file explorer. When enabled, dragging from the explorer sidebar into your terminal will paste the vault-relative path. Default: **enabled**

### Finder drag & drop
Toggle drag-drop support for files/folders dragged from your system's file manager (Finder on macOS, etc.). When enabled, dragging from external file managers into your terminal will paste the absolute filesystem path. Default: **enabled**

Both settings can be toggled independently, giving you fine-grained control over which drag sources you want to use.

## Compatibility

- **Obsidian Version**: 1.4.0 or later
- **Platform**: Desktop only (macOS, Windows, Linux)
- **Terminal Plugin**: Works with any terminal plugin that uses xterm.js, such as:
  - [obsidian-terminal](https://github.com/polyipseity/obsidian-terminal)
  - [terminal-plugin](https://github.com/Eccentric-Coding/terminal-plugin)

Note: This plugin requires xterm.js-based terminal integration. It will not work with terminal implementations that use different rendering engines.

## Development

### Prerequisites

- Node.js 16+
- npm

### Setup

```bash
npm install
```

### Development Mode

Run the development build watcher:

```bash
npm run dev
```

This will watch for changes and automatically rebuild the plugin as you edit files.

### Production Build

Build the plugin for release:

```bash
npm run build
```

This runs TypeScript type checking and produces optimized output files:
- `main.js` - The compiled plugin code
- `manifest.json` - Plugin metadata
- `styles.css` - Plugin styles

### Project Structure

```
.
├── main.ts           # Main plugin code with drag-drop handlers
├── manifest.json     # Plugin metadata and configuration
├── styles.css        # Terminal highlight styling
├── package.json      # Dependencies and build scripts
├── tsconfig.json     # TypeScript configuration
└── esbuild.config.mjs # Build configuration
```

### Code Overview

- **main.ts**: Contains the plugin class with all drag-drop event handlers, shell path escaping logic, and terminal integration
- **styles.css**: Defines the visual highlight effect when dragging over the terminal

## Troubleshooting

### Paths not pasting into terminal

1. Ensure the terminal plugin you're using is based on xterm.js
2. Check that both "Explorer drag & drop" and "Finder drag & drop" settings are enabled (or the relevant one for your use case)
3. If the plugin shows a "Path copied to clipboard" notification, manually paste with `Cmd+V`

### Terminal doesn't highlight during drag

The terminal should show a colored outline when you drag over it. If it doesn't:
- Verify the terminal pane is active and visible
- Restart Obsidian if the visual feedback doesn't appear
- Check browser console for any errors (Ctrl+Shift+I on Windows/Linux, Cmd+Option+I on macOS)

### "xterm textarea not found" errors

This occurs when the terminal plugin's underlying xterm.js textarea isn't accessible. Try:
- Ensure the terminal has focus before dragging
- Update your terminal plugin to the latest version
- Verify xterm.js is properly initialized in the terminal plugin

## License

MIT License - See LICENSE file for details

## Author

Created by [DevAutoFarm](https://github.com/DevAutoFarm)

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on the project repository.
