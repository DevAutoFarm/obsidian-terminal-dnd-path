import { Plugin, Notice, PluginSettingTab, App, Setting } from 'obsidian';

interface TerminalDndSettings {
    enableExplorerDnd: boolean;
    enableFinderDnd: boolean;
}

const DEFAULT_SETTINGS: TerminalDndSettings = {
    enableExplorerDnd: true,
    enableFinderDnd: true,
};

export default class TerminalDndPathPlugin extends Plugin {
    private draggedPath: string | null = null;
    private dragCleanupTimer: ReturnType<typeof setTimeout> | null = null;
    settings: TerminalDndSettings = DEFAULT_SETTINGS;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new TerminalDndSettingTab(this.app, this));

        // Capture drag start from file explorer
        this.registerDomEvent(document, 'dragstart', (e: DragEvent) => {
            const target = e.target as HTMLElement;
            const fileItem = target?.closest('.nav-file-title, .nav-folder-title') as HTMLElement | null;
            if (fileItem && fileItem.dataset.path) {
                this.draggedPath = fileItem.dataset.path;

                // Safety: auto-clear after 10s in case dragend doesn't fire
                if (this.dragCleanupTimer) clearTimeout(this.dragCleanupTimer);
                this.dragCleanupTimer = setTimeout(() => {
                    this.draggedPath = null;
                }, 10000);
            }
        }, true);

        // Clear on drag end
        this.registerDomEvent(document, 'dragend', () => {
            this.draggedPath = null;
            document.querySelectorAll('.xterm.dnd-path-dragover').forEach(el => {
                el.classList.remove('dnd-path-dragover');
            });
        }, true);

        // Allow dragenter on terminal (required for Finder drops in some Electron versions)
        this.registerDomEvent(document, 'dragenter', (e: DragEvent) => {
            const xtermEl = (e.target as HTMLElement)?.closest('.xterm');
            if (!xtermEl) return;

            const isExternalDrag = e.dataTransfer?.types?.includes('Files') ?? false;

            if (isExternalDrag && this.settings.enableFinderDnd) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (this.draggedPath && this.settings.enableExplorerDnd) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);

        // Allow drop on terminal
        this.registerDomEvent(document, 'dragover', (e: DragEvent) => {
            const xtermEl = (e.target as HTMLElement)?.closest('.xterm');
            if (!xtermEl) {
                document.querySelectorAll('.xterm.dnd-path-dragover').forEach(el => {
                    el.classList.remove('dnd-path-dragover');
                });
                return;
            }

            const isExternalDrag = e.dataTransfer?.types?.includes('Files') ?? false;

            if (isExternalDrag && this.settings.enableFinderDnd) {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
                xtermEl.classList.add('dnd-path-dragover');
                return;
            }

            if (this.draggedPath && this.settings.enableExplorerDnd) {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
                xtermEl.classList.add('dnd-path-dragover');
                return;
            }
        }, true);

        // Handle drop on terminal
        this.registerDomEvent(document, 'drop', (e: DragEvent) => {
            const xtermEl = (e.target as HTMLElement)?.closest('.xterm') as HTMLElement | null;
            if (!xtermEl) return;

            const isExternalDrag = e.dataTransfer?.types?.includes('Files') ?? false;

            // Finder DnD: external file drop
            if (isExternalDrag && this.settings.enableFinderDnd) {
                e.preventDefault();
                e.stopPropagation();

                const files = e.dataTransfer?.files;
                if (files && files.length > 0) {
                    const filePath = this.getFileAbsolutePath(files[0]);
                    if (filePath) {
                        const escapedPath = this.escapeShellPath(filePath);
                        this.pasteToTerminal(xtermEl, escapedPath);
                    }
                }

                xtermEl.classList.remove('dnd-path-dragover');
                return;
            }

            // Explorer DnD: internal obsidian file explorer drag
            if (this.draggedPath && this.settings.enableExplorerDnd) {
                e.preventDefault();
                e.stopPropagation();

                const escapedPath = this.escapeShellPath(this.draggedPath);
                this.pasteToTerminal(xtermEl, escapedPath);

                xtermEl.classList.remove('dnd-path-dragover');
                this.draggedPath = null;
                return;
            }
        }, true);
    }

    onunload() {
        if (this.dragCleanupTimer) clearTimeout(this.dragCleanupTimer);
        document.querySelectorAll('.xterm.dnd-path-dragover').forEach(el => {
            el.classList.remove('dnd-path-dragover');
        });
    }

    private pasteToTerminal(xtermEl: HTMLElement, escapedPath: string): void {
        try {
            const textarea = xtermEl.querySelector('textarea.xterm-helper-textarea');
            if (textarea) {
                const dt = new DataTransfer();
                dt.setData('text/plain', escapedPath);
                const clipboardEvent = new ClipboardEvent('paste', {
                    clipboardData: dt,
                    bubbles: true,
                    cancelable: true
                });
                if (clipboardEvent.clipboardData &&
                    clipboardEvent.clipboardData.getData('text/plain') === escapedPath) {
                    textarea.dispatchEvent(clipboardEvent);
                } else {
                    throw new Error('ClipboardEvent data not passed');
                }
            } else {
                throw new Error('xterm textarea not found');
            }
        } catch {
            navigator.clipboard.writeText(escapedPath).then(() => {
                new Notice('Path copied to clipboard. Press Cmd+V to paste: ' + escapedPath);
            }).catch(() => {
                new Notice('Failed to copy path: ' + escapedPath);
            });
        }
    }

    private escapeShellPath(path: string): string {
        if (!/[ '"()&|;<>!$`\\#~{}[\]*?]/.test(path)) return path;
        return "'" + path.replace(/'/g, "'\\''") + "'";
    }

    private getFileAbsolutePath(file: File): string | undefined {
        // Modern Electron 29+: use webUtils API
        try {
            const { webUtils } = require('electron');
            if (webUtils?.getPathForFile) {
                const path = webUtils.getPathForFile(file);
                if (path && path.length > 0) return path;
            }
        } catch {
            // Not available (non-Electron environment)
        }
        // Legacy Electron <32: File.path property
        const legacyPath = (file as any).path;
        if (legacyPath && typeof legacyPath === 'string' && legacyPath.length > 0) {
            return legacyPath;
        }
        return undefined;
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class TerminalDndSettingTab extends PluginSettingTab {
    plugin: TerminalDndPathPlugin;

    constructor(app: App, plugin: TerminalDndPathPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Explorer drag & drop')
            .setDesc('Drag files/folders from the Obsidian file explorer into the terminal to paste their path.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableExplorerDnd)
                .onChange(async (value) => {
                    this.plugin.settings.enableExplorerDnd = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Finder drag & drop')
            .setDesc('Drag files/folders from Finder (or other file managers) into the terminal to paste their absolute path.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableFinderDnd)
                .onChange(async (value) => {
                    this.plugin.settings.enableFinderDnd = value;
                    await this.plugin.saveSettings();
                }));
    }
}
