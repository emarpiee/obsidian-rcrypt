import { App, FuzzySuggestModal, Modal, Notice, Setting, TAbstractFile, TFile, TFolder, setIcon } from 'obsidian';
import { processItems } from '../contextMenu/registerMenu';
import { getText } from '../i18n/i18n';
import type { CryptProfile, FilenameEncoding, FilenameEncryptionMode } from '../types';
import type RCryptPlugin from '../main';

export interface PassphrasePromptResult {
	profileId: string;
	passphrase: string;
	salt: string;
	customFilenameEncryptionMode?: FilenameEncryptionMode;
	customFilenameEncoding?: FilenameEncoding;
	customEncryptedExtension?: string;
}

export class PassphraseModal extends Modal {
	private selectedProfileId: string;
	private passphrase = '';
	private salt = '';
	private customMode: FilenameEncryptionMode = 'standard';
	private customEncoding: FilenameEncoding = 'base32';
	private customSuffix = '.rcrypt';
	private profiles: CryptProfile[];
	private onSubmit: (result: PassphrasePromptResult) => Promise<boolean> | boolean;
	private modalTitle: string;
	private items?: TAbstractFile[];

	constructor(
		app: App,
		modalTitle: string,
		profiles: CryptProfile[],
		initialProfileId: string,
		onSubmit: (result: PassphrasePromptResult) => Promise<boolean> | boolean,
		items?: TAbstractFile[]
	) {
		super(app);
		this.modalTitle = modalTitle;
		this.profiles = profiles;
		this.selectedProfileId = initialProfileId;
		this.onSubmit = onSubmit;
		this.items = items;

		const profile = profiles.find((p) => p.id === initialProfileId);
		if (profile) {
			this.passphrase = profile.passphrase || '';
			this.salt = profile.salt || '';
			this.customMode = profile.filenameEncryptionMode;
			this.customEncoding = profile.filenameEncoding;
			this.customSuffix = profile.encryptedExtension;
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

		new Setting(contentEl)
			.setName(t.profileSettingTitle || 'Crypt Profile')
			.setDesc(t.profileSettingDesc || 'Select profile credentials or custom parameters')
			.addDropdown((dropdown) => {
				for (const p of this.profiles) {
					dropdown.addOption(p.id, p.name);
				}
				dropdown.addOption('custom', 'Custom...');
				dropdown.setValue(this.selectedProfileId);
				dropdown.onChange((val) => {
					this.selectedProfileId = val;
					const selProf = this.profiles.find((p) => p.id === val);
					if (selProf) {
						this.passphrase = selProf.passphrase || '';
						this.salt = selProf.salt || '';
						this.customMode = selProf.filenameEncryptionMode;
						this.customEncoding = selProf.filenameEncoding;
						this.customSuffix = selProf.encryptedExtension;
					} else if (val === 'custom') {
						this.passphrase = '';
						this.salt = '';
						this.customMode = 'standard';
						this.customEncoding = 'base32';
						this.customSuffix = '.rcrypt';
					}
					if (passInputEl) passInputEl.value = this.passphrase;
					if (saltInputEl) saltInputEl.value = this.salt;
					renderCustomControls();
					errorDiv.setCssProps({ display: 'none' });
				});
			});

		const customContainer = contentEl.createDiv({ cls: 'rcrypt-custom-config-container' });

		const renderCustomControls = (): void => {
			customContainer.empty();
			if (this.selectedProfileId !== 'custom') return;

			// Passphrase Input Setting with Toggle Password Visibility button
			const passSetting = new Setting(customContainer)
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

			// Salt Input Setting
			const saltSetting = new Setting(customContainer)
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

			let encodingSetting: Setting | undefined;
			let suffixSetting: Setting | undefined;

			const updateModeVisibility = (): void => {
				const isOff = this.customMode === 'off';
				if (encodingSetting !== undefined) {
					encodingSetting.settingEl.style.display = isOff ? 'none' : '';
				}
				if (suffixSetting !== undefined) {
					// Show suffix textbox whenever mode is OFF, or when custom mode is used (for decrypting files created with custom suffix or OFF mode)
					suffixSetting.settingEl.style.display = isOff ? '' : 'none';
				}
			};

			new Setting(customContainer)
				.setName(t.filenameEncryptionModeName)
				.setDesc(t.filenameEncryptionModeDesc)
				.addDropdown((d) => {
					d.addOption('standard', t.modeStandard);
					d.addOption('obfuscate', t.modeObfuscate);
					d.addOption('off', t.modeOff);
					d.setValue(this.customMode);
					d.onChange((val) => {
						this.customMode = val as FilenameEncryptionMode;
						updateModeVisibility();
					});
				});

			encodingSetting = new Setting(customContainer)
				.setName(t.filenameEncodingName)
				.setDesc(t.filenameEncodingDesc)
				.addDropdown((d) => {
					d.addOption('base32', t.encodingBase32);
					d.addOption('base64', t.encodingBase64);
					d.setValue(this.customEncoding);
					d.onChange((val) => {
						this.customEncoding = val as FilenameEncoding;
					});
				});

			suffixSetting = new Setting(customContainer)
				.setName(t.encryptedSuffixName)
				.setDesc(t.encryptedSuffixDesc)
				.addText((text) => {
					text.setValue(this.customSuffix);
					text.setPlaceholder('.rcrypt');
					text.onChange((val) => {
						this.customSuffix = val;
					});
				});

			updateModeVisibility();
		};

		renderCustomControls();

		if (this.items && this.items.length > 0) {
			const { treeText, totalLines } = generateTreeText(this.items);
			const itemArea = contentEl.createEl('textarea', {
				cls: 'rcrypt-items-textarea',
				text: treeText,
			});
			itemArea.readOnly = true;
			itemArea.rows = Math.min(Math.max(totalLines, 2), 10);
			itemArea.setCssProps({
				width: '100%',
				resize: 'vertical',
				fontFamily: 'var(--font-monospace)',
				fontSize: '12px',
				lineHeight: '1.4',
				whiteSpace: 'pre',
				marginTop: '10px',
				marginBottom: '15px',
				padding: '8px',
				borderRadius: '4px',
			});
		}

		new Setting(contentEl).addButton((btn) => {
			btn
				.setButtonText(t.modalConfirmBtn)
				.setCta()
				.onClick(async () => {
					if (this.selectedProfileId === 'custom' && !this.passphrase) {
						errorDiv.setText(t.modalErrPassphraseRequired);
						errorDiv.setCssProps({ display: 'block' });
						return;
					}

					try {
						const success = await this.onSubmit({
							profileId: this.selectedProfileId,
							passphrase: this.passphrase,
							salt: this.salt,
							customFilenameEncryptionMode: this.customMode,
							customFilenameEncoding: this.customEncoding,
							customEncryptedExtension: this.customSuffix,
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
	private profiles: CryptProfile[];
	private selectedProfileId: string;
	private customPassphrase = '';
	private customSalt = '';
	private customMode: FilenameEncryptionMode = 'standard';
	private customEncoding: FilenameEncoding = 'base32';
	private customSuffix = '.rcrypt';
	private onConfirm: (profile: CryptProfile) => void;

	constructor(
		app: App,
		items: TAbstractFile[],
		profiles: CryptProfile[],
		initialProfileId: string,
		onConfirm: (profile: CryptProfile) => void
	) {
		super(app);
		this.items = items;
		this.profiles = profiles;
		this.selectedProfileId = initialProfileId;
		this.onConfirm = onConfirm;

		const profile = profiles.find((p) => p.id === initialProfileId);
		if (profile) {
			this.customMode = profile.filenameEncryptionMode;
			this.customEncoding = profile.filenameEncoding;
			this.customSuffix = profile.encryptedExtension;
		}
	}

	onOpen(): void {
		const { contentEl } = this;
		const t = getText();
		this.setTitle(t.confirmEncryptTitle || 'Confirm Encryption');
		contentEl.empty();

		const { treeText, totalFiles, totalLines } = generateTreeText(this.items);

		const errorDiv = contentEl.createDiv({ cls: 'rcrypt-modal-error' });
		errorDiv.setCssProps({ display: 'none', marginBottom: '10px' });

		const descEl = contentEl.createEl('p');
		const infoDiv = contentEl.createDiv({ cls: 'rcrypt-profile-info' });
		infoDiv.setCssProps({
			fontSize: '12px',
			marginBottom: '12px',
			color: 'var(--text-muted)',
		});

		const customContainer = contentEl.createDiv({ cls: 'rcrypt-custom-config-container' });

		const updateProfileDisplay = (): void => {
			customContainer.empty();
			infoDiv.empty();

			if (this.selectedProfileId === 'custom') {
				descEl.setText(
					`Are you sure you want to encrypt ${totalFiles} item(s) using Custom Configuration?`
				);

				let passInputEl: HTMLInputElement | undefined;
				let saltInputEl: HTMLInputElement | undefined;

				const passSetting = new Setting(customContainer)
					.setName(t.modalPassphraseName)
					.setDesc(t.modalPassphraseDesc)
					.addText((text) => {
						text.setValue(this.customPassphrase);
						text.setPlaceholder(t.modalPassphrasePlaceholder);
						text.inputEl.type = 'password';
						passInputEl = text.inputEl;
						text.onChange((val) => {
							this.customPassphrase = val;
							errorDiv.setCssProps({ display: 'none' });
						});
					});

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

				const saltSetting = new Setting(customContainer)
					.setName(t.modalSaltName)
					.setDesc(t.modalSaltDesc)
					.addText((text) => {
						text.setValue(this.customSalt);
						text.setPlaceholder(t.defaultSaltPlaceholder);
						text.inputEl.type = 'password';
						saltInputEl = text.inputEl;
						text.onChange((val) => {
							this.customSalt = val;
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

				let encodingSetting: Setting | undefined;
				let suffixSetting: Setting | undefined;

				const updateModeVisibility = (): void => {
					const isOff = this.customMode === 'off';
					if (encodingSetting !== undefined) {
						encodingSetting.settingEl.style.display = isOff ? 'none' : '';
					}
					if (suffixSetting !== undefined) {
						suffixSetting.settingEl.style.display = isOff ? '' : 'none';
					}
				};

				new Setting(customContainer)
					.setName(t.filenameEncryptionModeName)
					.setDesc(t.filenameEncryptionModeDesc)
					.addDropdown((d) => {
						d.addOption('standard', t.modeStandard);
						d.addOption('obfuscate', t.modeObfuscate);
						d.addOption('off', t.modeOff);
						d.setValue(this.customMode);
						d.onChange((val) => {
							this.customMode = val as FilenameEncryptionMode;
							updateModeVisibility();
						});
					});

				encodingSetting = new Setting(customContainer)
					.setName(t.filenameEncodingName)
					.setDesc(t.filenameEncodingDesc)
					.addDropdown((d) => {
						d.addOption('base32', t.encodingBase32);
						d.addOption('base64', t.encodingBase64);
						d.setValue(this.customEncoding);
						d.onChange((val) => {
							this.customEncoding = val as FilenameEncoding;
						});
					});

				suffixSetting = new Setting(customContainer)
					.setName(t.encryptedSuffixName)
					.setDesc(t.encryptedSuffixDesc)
					.addText((text) => {
						text.setValue(this.customSuffix);
						text.setPlaceholder('.rcrypt');
						text.onChange((val) => {
							this.customSuffix = val;
						});
					});

				updateModeVisibility();
			} else {
				const selectedProfile = this.profiles.find((p) => p.id === this.selectedProfileId) || this.profiles[0];
				const descText = t.confirmEncryptDesc
					? t.confirmEncryptDesc(totalFiles, selectedProfile.name)
					: `Are you sure you want to encrypt ${totalFiles} item(s) using profile "${selectedProfile.name}"?`;
				descEl.setText(descText);

				const modeLabel =
					selectedProfile.filenameEncryptionMode === 'standard'
						? t.modeStandard
						: selectedProfile.filenameEncryptionMode === 'obfuscate'
						? t.modeObfuscate
						: t.modeOff;

				const encodingLabel =
					selectedProfile.filenameEncoding === 'base64'
						? t.encodingBase64
						: t.encodingBase32;

				const modeDiv = infoDiv.createDiv();
				modeDiv.createSpan({ text: 'Filename mode: ' });
				modeDiv.createEl('strong', { text: modeLabel });

				const encodingDiv = infoDiv.createDiv();
				encodingDiv.setCssProps({ marginTop: '4px' });
				encodingDiv.createSpan({ text: 'Filename encoding: ' });
				encodingDiv.createEl('strong', { text: encodingLabel });
			}
		};

		new Setting(contentEl)
			.setName(t.profileSettingTitle || 'Crypt Profile')
			.setDesc(t.profileSettingDesc || 'Select profile for encryption')
			.addDropdown((dropdown) => {
				for (const p of this.profiles) {
					dropdown.addOption(p.id, p.name);
				}
				dropdown.addOption('custom', 'Custom...');
				dropdown.setValue(this.selectedProfileId);
				dropdown.onChange((val) => {
					this.selectedProfileId = val;
					updateProfileDisplay();
					errorDiv.setCssProps({ display: 'none' });
				});
			});

		updateProfileDisplay();

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
					if (this.selectedProfileId === 'custom') {
						if (!this.customPassphrase) {
							errorDiv.setText(t.modalErrPassphraseRequired || 'Passphrase is required.');
							errorDiv.setCssProps({ display: 'block' });
							return;
						}
						const customProfile: CryptProfile = {
							id: 'custom',
							name: 'Custom Configuration',
							passphrase: this.customPassphrase,
							salt: this.customSalt,
							filenameEncryptionMode: this.customMode,
							filenameEncoding: this.customEncoding,
							encryptedExtension: this.customSuffix,
							encryptFolderNames: false,
							savePassphraseOnDisk: false,
						};
						this.close();
						this.onConfirm(customProfile);
					} else {
						const selectedProfile = this.profiles.find((p) => p.id === this.selectedProfileId) || this.profiles[0];
						this.close();
						this.onConfirm(selectedProfile);
					}
				});
		});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}


