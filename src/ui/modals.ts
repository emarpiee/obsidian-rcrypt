import { App, FuzzySuggestModal, Modal, Notice, Setting, TAbstractFile, TFile, TFolder, setIcon } from 'obsidian';
import { processItems } from '../contextMenu/registerMenu';
import { getText } from '../i18n/i18n';
import type { CryptProfile } from '../types';
import type RCryptPlugin from '../main';

export interface PassphrasePromptResult {
	profileId: string;
	passphrase: string;
	salt: string;
}

export class PassphraseModal extends Modal {
	private selectedProfileId: string;
	private passphrase = '';
	private salt = '';
	private profiles: CryptProfile[];
	private onSubmit: (result: PassphrasePromptResult) => Promise<boolean> | boolean;
	private modalTitle: string;

	constructor(
		app: App,
		modalTitle: string,
		profiles: CryptProfile[],
		initialProfileId: string,
		onSubmit: (result: PassphrasePromptResult) => Promise<boolean> | boolean
	) {
		super(app);
		this.modalTitle = modalTitle;
		this.profiles = profiles;
		this.selectedProfileId = initialProfileId;
		this.onSubmit = onSubmit;

		const profile = profiles.find((p) => p.id === initialProfileId) || profiles[0];
		if (profile) {
			this.passphrase = profile.passphrase || '';
			this.salt = profile.salt || '';
		}
	}

	onOpen(): void {
		const { contentEl } = this;
		const t = getText();
		this.setTitle(this.modalTitle);
		contentEl.empty();

		const errorDiv = contentEl.createDiv({ cls: 'rcrypt-modal-error' });
		errorDiv.setCssProps({ display: 'none' });

		let passInputEl: HTMLInputElement | undefined;
		let saltInputEl: HTMLInputElement | undefined;

		if (this.profiles.length > 0) {
			new Setting(contentEl)
				.setName(t.profileSettingTitle || 'Crypt Profile')
				.setDesc(t.profileSettingDesc || 'Select profile credentials for decryption')
				.addDropdown((dropdown) => {
					for (const p of this.profiles) {
						dropdown.addOption(p.id, p.name);
					}
					dropdown.setValue(this.selectedProfileId);
					dropdown.onChange((val) => {
						this.selectedProfileId = val;
						const selProf = this.profiles.find((p) => p.id === val);
						if (selProf) {
							this.passphrase = selProf.passphrase || '';
							this.salt = selProf.salt || '';
							if (passInputEl) passInputEl.value = this.passphrase;
							if (saltInputEl) saltInputEl.value = this.salt;
						}
						errorDiv.setCssProps({ display: 'none' });
					});
				});
		}

		// Passphrase Input Setting with Toggle Password Visibility button
		const passSetting = new Setting(contentEl)
			.setName(t.modalPassphraseName)
			.setDesc(t.modalPassphraseDesc)
			.addText((text) => {
				text.setValue(this.passphrase);
				text.setPlaceholder(t.modalPassphrasePlaceholder);
				text.inputEl.type = 'password';
				passInputEl = text.inputEl;
				text.onChange((value) => {
					this.passphrase = value;
					errorDiv.setCssProps({ display: 'none' });
				});
				text.inputEl.focus();
			});

		// Add show/hide password toggle button with Obsidian Lucide icon
		passSetting.addButton((btn) => {
			btn.setIcon('eye').setTooltip('Show/hide passphrase').onClick(() => {
				if (passInputEl) {
					if (passInputEl.type === 'password') {
						passInputEl.type = 'text';
						setIcon(btn.buttonEl, 'eye-off');
					} else {
						passInputEl.type = 'password';
						setIcon(btn.buttonEl, 'eye');
					}
				}
			});
		});

		// Salt Input Setting (Masked as password) with Toggle Visibility button
		const saltSetting = new Setting(contentEl)
			.setName(t.modalSaltName)
			.setDesc(t.modalSaltDesc)
			.addText((text) => {
				text.setValue(this.salt);
				text.setPlaceholder(t.defaultSaltPlaceholder);
				text.inputEl.type = 'password';
				saltInputEl = text.inputEl;
				text.onChange((value) => {
					this.salt = value;
					errorDiv.setCssProps({ display: 'none' });
				});
			});

		saltSetting.addButton((btn) => {
			btn.setIcon('eye').setTooltip('Show/hide salt').onClick(() => {
				if (saltInputEl) {
					if (saltInputEl.type === 'password') {
						saltInputEl.type = 'text';
						setIcon(btn.buttonEl, 'eye-off');
					} else {
						saltInputEl.type = 'password';
						setIcon(btn.buttonEl, 'eye');
					}
				}
			});
		});

		new Setting(contentEl).addButton((btn) => {
			btn
				.setButtonText(t.modalConfirmBtn)
				.setCta()
				.onClick(async () => {
					if (!this.passphrase) {
						errorDiv.setText(t.modalErrPassphraseRequired);
						errorDiv.setCssProps({ display: 'block' });
						return;
					}

					try {
						const success = await this.onSubmit({
							profileId: this.selectedProfileId,
							passphrase: this.passphrase,
							salt: this.salt,
						});
						if (success) {
							this.close();
						} else {
							errorDiv.setText(t.modalErrDecryptFailed);
							errorDiv.setCssProps({ display: 'block' });
							new Notice(t.modalErrDecryptFailed, 8000);
						}
					} catch (err: unknown) {
						const msg = err instanceof Error ? err.message : 'Invalid passphrase or file error.';
						errorDiv.setText(`❌ ${msg}`);
						errorDiv.setCssProps({ display: 'block' });
					}
				});
		});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class EncryptSuggestModal extends FuzzySuggestModal<TAbstractFile> {
	private plugin: RCryptPlugin;

	constructor(app: App, plugin: RCryptPlugin) {
		super(app);
		this.plugin = plugin;
		const t = getText();
		this.setPlaceholder(t.suggestModalPlaceholder || 'Search file or folder to encrypt...');
	}

	getItems(): TAbstractFile[] {
		return this.app.vault.getAllLoadedFiles().filter((file) => file.path !== '/');
	}

	getItemText(item: TAbstractFile): string {
		return item.path;
	}

	onChooseItem(item: TAbstractFile, _evt: MouseEvent | KeyboardEvent): void {
		const activeProfile = this.plugin.engine.getActiveProfile();
		void processItems(this.plugin, [item], 'encrypt', false, activeProfile.id);
	}
}

function renderFolderTree(folder: TFolder, prefix = ''): string[] {
	const lines: string[] = [];
	const children = [...folder.children].sort((a, b) => {
		if ((a instanceof TFolder) === (b instanceof TFolder)) {
			return a.name.localeCompare(b.name);
		}
		return a instanceof TFolder ? -1 : 1;
	});

	children.forEach((child, index) => {
		const isLast = index === children.length - 1;
		const connector = isLast ? '└── ' : '├── ';
		const childPrefix = isLast ? '    ' : '│   ';

		if (child instanceof TFolder) {
			lines.push(`${prefix}${connector}${child.name}/`);
			lines.push(...renderFolderTree(child, prefix + childPrefix));
		} else {
			lines.push(`${prefix}${connector}${child.name}`);
		}
	});

	return lines;
}

function generateTreeText(items: TAbstractFile[]): { treeText: string; totalFiles: number; totalLines: number } {
	const lines: string[] = [];
	let totalFiles = 0;

	const countFiles = (item: TAbstractFile): void => {
		if (item instanceof TFile) {
			totalFiles++;
		} else if (item instanceof TFolder) {
			for (const child of item.children) {
				countFiles(child);
			}
		}
	};

	items.forEach((item) => {
		countFiles(item);
		if (item instanceof TFolder) {
			lines.push(`${item.path}/`);
			lines.push(...renderFolderTree(item, ''));
		} else {
			lines.push(item.path);
		}
	});

	return { treeText: lines.join('\n'), totalFiles, totalLines: lines.length };
}

export class ConfirmEncryptModal extends Modal {
	private items: TAbstractFile[];
	private profile: CryptProfile;
	private onConfirm: () => void;

	constructor(app: App, items: TAbstractFile[], profile: CryptProfile, onConfirm: () => void) {
		super(app);
		this.items = items;
		this.profile = profile;
		this.onConfirm = onConfirm;
	}

	onOpen(): void {
		const { contentEl } = this;
		const t = getText();
		this.setTitle(t.confirmEncryptTitle || 'Confirm Encryption');
		contentEl.empty();

		const { treeText, totalFiles, totalLines } = generateTreeText(this.items);

		const descText = t.confirmEncryptDesc
			? t.confirmEncryptDesc(totalFiles, this.profile.name)
			: `Are you sure you want to encrypt ${totalFiles} item(s) using profile "${this.profile.name}"?`;

		contentEl.createEl('p', { text: descText });

		const modeLabel =
			this.profile.filenameEncryptionMode === 'standard'
				? t.modeStandard
				: this.profile.filenameEncryptionMode === 'obfuscate'
				? t.modeObfuscate
				: t.modeOff;

		const encodingLabel =
			this.profile.filenameEncoding === 'base64'
				? t.encodingBase64
				: this.profile.filenameEncoding === 'base32768'
				? 'Base32768'
				: t.encodingBase32;

		const infoDiv = contentEl.createDiv({ cls: 'rcrypt-profile-info' });
		infoDiv.setCssProps({
			fontSize: '12px',
			marginBottom: '12px',
			color: 'var(--text-muted)',
		});
		infoDiv.createSpan({ text: 'Filename mode: ' });
		infoDiv.createEl('strong', { text: modeLabel });
		infoDiv.createSpan({ text: ' • encoding: ' });
		infoDiv.createEl('strong', { text: encodingLabel });

		const itemArea = contentEl.createEl('textarea', {
			cls: 'rcrypt-items-textarea',
			text: treeText,
		});
		itemArea.readOnly = true;
		itemArea.rows = Math.min(Math.max(totalLines, 4), 12);
		itemArea.setCssProps({
			width: '100%',
			resize: 'vertical',
			fontFamily: 'var(--font-monospace)',
			fontSize: '12px',
			lineHeight: '1.4',
			whiteSpace: 'pre',
			marginBottom: '15px',
			padding: '8px',
			borderRadius: '4px',
		});

		const warningBox = contentEl.createDiv({ cls: 'rcrypt-modal-error' });
		warningBox.setCssProps({ display: 'block', marginBottom: '15px' });
		warningBox.setText(
			t.confirmEncryptWarning ||
				'Important: Ensure your passphrase and salt are saved or remembered safely. If auto-delete source is enabled, unencrypted source files will be permanently deleted after encryption.'
		);

		const setting = new Setting(contentEl);
		setting.addButton((btn) => {
			btn.setButtonText(t.cancelBtn || 'Cancel').onClick(() => {
				this.close();
			});
		});

		setting.addButton((btn) => {
			btn
				.setButtonText(t.confirmEncryptBtn || 'Encrypt')
				.setWarning()
				.onClick(() => {
					this.close();
					this.onConfirm();
				});
		});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}


