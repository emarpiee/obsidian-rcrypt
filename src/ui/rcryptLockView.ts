import { FileView, WorkspaceLeaf } from 'obsidian';

export const VIEW_TYPE_RCRYPT = 'rcrypt-lock';

/**
 * Dummy FileView for encrypted files that prevents Obsidian from instantiating CodeMirror or
 * reading/writing binary ciphertext as UTF-8 text when files are opened/dragged into leaves.
 */
export class RCryptLockView extends FileView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_RCRYPT;
	}

	getDisplayText(): string {
		return this.file ? this.file.name : '';
	}

	// Override data methods as strict no-ops to prevent UTF-8 text conversion or auto-saving
	setViewData(_data: string, _clear: boolean): void {
		// No-op: Do not load or decode binary ciphertext
	}

	getViewData(): string {
		return '';
	}

	async save(): Promise<void> {
		// No-op: Never write back to disk
	}

	render(): void {
		this.contentEl.empty();
	}
}
