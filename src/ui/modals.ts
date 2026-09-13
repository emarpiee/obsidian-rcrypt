import { AbstractInputSuggest, App, FuzzySuggestModal, Modal, Setting, TAbstractFile, TFile, TFolder, setIcon } from 'obsidian';
import { processItems } from '../contextMenu/registerMenu';
import { getText } from '../i18n/i18n';
import type { CryptProfile, FilenameEncoding, FilenameEncryptionMode } from '../types';
import type RCryptPlugin from '../main';

export interface PassphrasePromptResult {
	profileId: string;
	passphrase: string;
	salt: string;
	autoEncryptOnClose?: boolean;
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
	private customSuffix = '.bin';
	private profiles: CryptProfile[];
	private onSubmit: (result: PassphrasePromptResult) => Promise<boolean> | boolean;
	private modalTitle: string;
	private items?: TAbstractFile[];
	private action?: 'encrypt' | 'decrypt';
	private isSubmitted = false;

	constructor(
		app: App,
		modalTitle: string,
		profiles: CryptProfile[],
		initialProfileId: string,
		onSubmit: (result: PassphrasePromptResult) => Promise<boolean> | boolean,
		items?: TAbstractFile[],
		action?: 'encrypt' | 'decrypt'
	) {
		super(app);
		this.modalTitle = modalTitle;
		this.profiles = profiles;
		this.selectedProfileId = initialProfileId;
		this.onSubmit = onSubmit;
		this.items = items;
		this.action = action;

		const profile = profiles.find((p) => p.id === initialProfileId);
		if (profile) {
			this.passphrase = profile.savePassphraseOnDisk ? (profile.passphrase || '') : '';
			this.salt = profile.savePassphraseOnDisk ? (profile.salt || '') : '';
			this.customMode = profile.filenameEncryptionMode;
			this.customEncoding = profile.filenameEncoding;
			this.customSuffix = profile.encryptedExtension;
		}
	}

	onOpen(): void {
		const { containerEl, contentEl } = this;
		containerEl.addClass('rcrypt-modal');
		const t = getText();
		this.setTitle(this.modalTitle);
		contentEl.empty();

		const errorDiv = contentEl.createDiv({ cls: 'rcrypt-modal-error' });
		errorDiv.setCssProps({ display: 'none' });

		let passInputEl: HTMLInputElement | undefined;
		let saltInputEl: HTMLInputElement | undefined;

		const hintEl = contentEl.createDiv({ cls: 'rcrypt-profile-hint' });
		hintEl.setCssProps({
			fontSize: '12px',
			color: 'var(--text-accent)',
			marginTop: '4px',
			marginBottom: '10px',
			fontStyle: 'italic',
		});

		const updateHintDisplay = (): void => {
			hintEl.empty();
			if (this.selectedProfileId !== 'custom') {
				const activeProf = this.profiles.find((p) => p.id === this.selectedProfileId);
				if (activeProf && activeProf.passphraseHint) {
					const labelText = t.passphraseHintLabel
						? t.passphraseHintLabel(activeProf.passphraseHint)
						: `💡 Hint: ${activeProf.passphraseHint}`;
					hintEl.setText(labelText);
					hintEl.toggle(true);
					return;
				}
			}
			hintEl.toggle(false);
		};

		new Setting(contentEl)
			.setName(t.profileSettingTitle || 'Crypt Profile')
			.setDesc(t.profileSettingDesc || 'Select profile credentials or custom parameters')
			.addDropdown((dropdown) => {
				for (const p of this.profiles) {
					dropdown.addOption(p.id, p.name);
				}
				dropdown.addOption('custom', t.customProfileOption || 'Custom...');
				dropdown.setValue(this.selectedProfileId);
				dropdown.onChange((val) => {
					this.selectedProfileId = val;
					const selProf = this.profiles.find((p) => p.id === val);
					if (selProf) {
						this.passphrase = selProf.savePassphraseOnDisk ? (selProf.passphrase || '') : '';
						this.salt = selProf.savePassphraseOnDisk ? (selProf.salt || '') : '';
						this.customMode = selProf.filenameEncryptionMode;
						this.customEncoding = selProf.filenameEncoding;
						this.customSuffix = selProf.encryptedExtension;
					} else if (val === 'custom') {
						this.passphrase = '';
						this.salt = '';
						this.customMode = 'standard';
						this.customEncoding = 'base32';
						this.customSuffix = '.bin';
					}
					if (passInputEl) passInputEl.value = this.passphrase;
					if (saltInputEl) saltInputEl.value = this.salt;
					updateHintDisplay();
					renderCustomControls();
					errorDiv.setCssProps({ display: 'none' });
				});
			});

		updateHintDisplay();

		const customContainer = contentEl.createDiv({ cls: 'rcrypt-custom-config-container' });

		const renderCustomControls = (): void => {
			customContainer.empty();
			const activeProf = this.profiles.find((p) => p.id === this.selectedProfileId);
			const needsPassword = this.selectedProfileId === 'custom' || (activeProf && (!activeProf.savePassphraseOnDisk || !activeProf.passphrase));

			if (!needsPassword && this.selectedProfileId !== 'custom') return;

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
				btn.setIcon('eye').setTooltip(t.showHidePassphraseTooltip || 'Show/hide passphrase').onClick(() => {
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
				btn.setIcon('eye').setTooltip(t.showHideSaltTooltip || 'Show/hide salt').onClick(() => {
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

			if (this.selectedProfileId !== 'custom') return;

			let encodingSetting: Setting | undefined;
			let suffixSetting: Setting | undefined;

			const updateModeVisibility = (): void => {
				if (encodingSetting !== undefined) {
					encodingSetting.settingEl.style.display = this.customMode === 'standard' ? '' : 'none';
				}
				if (suffixSetting !== undefined) {
					suffixSetting.settingEl.style.display = this.customMode === 'off' ? '' : 'none';
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
					d.addOption('base32768', t.encodingBase32768 || 'Base32768 (Compact UTF-16)');
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
					text.setPlaceholder('.bin');
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

		const buttonSetting = new Setting(contentEl);
		buttonSetting.settingEl.addClass('rcrypt-modal-actions');

		const handleActionSubmit = async (autoEncryptOnClose: boolean): Promise<void> => {
			const activeProf = this.profiles.find((p) => p.id === this.selectedProfileId);
			const needsPassphrase = this.selectedProfileId === 'custom' || (activeProf && (!activeProf.savePassphraseOnDisk || !activeProf.passphrase));
			if (needsPassphrase && !this.passphrase) {
				errorDiv.setText(t.modalErrPassphraseRequired);
				errorDiv.setCssProps({ display: 'block' });
				return;
			}

			try {
				const success = await this.onSubmit({
					profileId: this.selectedProfileId,
					passphrase: this.passphrase,
					salt: this.salt,
					autoEncryptOnClose,
					customFilenameEncryptionMode: this.customMode,
					customFilenameEncoding: this.customEncoding,
					customEncryptedExtension: this.customSuffix,
				});
				if (success) {
					this.isSubmitted = true;
					this.close();
				} else {
					errorDiv.setText(t.modalErrDecryptFailed);
					errorDiv.setCssProps({ display: 'block' });
				}
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : (t.modalErrInvalidPassphrase || 'Invalid passphrase or file error.');
				errorDiv.setText(`❌ ${msg}`);
				errorDiv.setCssProps({ display: 'block' });
			}
		};

		if (this.action === 'decrypt') {
			buttonSetting.addButton((btn) => {
				btn
					.setButtonText(t.modalDecryptTempBtn || '🔓 Temporary view (lock on close)')
					.setCta()
					.onClick(() => {
						void handleActionSubmit(true);
					});
			});
			buttonSetting.addButton((btn) => {
				btn
					.setButtonText(t.modalDecryptPermBtn || '🔓 Permanent decrypt (keep plain file)')
					.onClick(() => {
						void handleActionSubmit(false);
					});
			});
		} else {
			buttonSetting.addButton((btn) => {
				btn
					.setButtonText(t.modalConfirmBtn)
					.setCta()
					.onClick(() => {
						void handleActionSubmit(false);
					});
			});
		}
	}

	onClose(): void {
		const { contentEl } = this;
		this.passphrase = '';
		this.salt = '';
		contentEl.empty();
		if (!this.isSubmitted) {
			const activeLeaf = this.app.workspace.getLeaf(false);
			if (activeLeaf) {
				activeLeaf.detach();
			}
		}
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
		const resolvedProfile = this.plugin.engine.getProfileForPath(item.path);
		void processItems(this.plugin, [item], 'encrypt', false, resolvedProfile.id);
	}
}

export interface MappedFolderItem {
	folderPath: string;
	profileId: string;
	profileName: string;
	folderObj?: TFolder;
}

export class MappedFolderSuggestModal extends FuzzySuggestModal<MappedFolderItem> {
	private plugin: RCryptPlugin;
	private action: 'encrypt' | 'decrypt';

	constructor(app: App, plugin: RCryptPlugin, action: 'encrypt' | 'decrypt') {
		super(app);
		this.plugin = plugin;
		this.action = action;
		const t = getText();
		this.setPlaceholder(
			action === 'encrypt'
				? (t.searchMappedFolderEncryptPlaceholder || 'Search mapped folder to encrypt...')
				: (t.searchMappedFolderDecryptPlaceholder || 'Search mapped folder to decrypt...')
		);
	}

	getItems(): MappedFolderItem[] {
		const mappings = this.plugin.settings.folderMappings || [];
		const allFolders = this.plugin.app.vault.getAllLoadedFiles().filter((f): f is TFolder => f instanceof TFolder);

		return mappings.map((m) => {
			const prof = this.plugin.engine.getProfileById(m.profileId);
			let folderObj = this.plugin.app.vault.getAbstractFileByPath(m.folderPath);

			if (!(folderObj instanceof TFolder)) {
				// If direct path lookup fails (because folder name is encrypted on disk), match against vault folders by decrypting each segment
				const mappedPath = m.folderPath;
				for (const vaultFolder of allFolders) {
					if (prof && this.matchEncryptedFolderPath(vaultFolder.path, mappedPath, prof)) {
						folderObj = vaultFolder;
						break;
					}
				}
			}

			return {
				folderPath: m.folderPath,
				profileId: m.profileId,
				profileName: prof ? prof.name : m.profileId,
				folderObj: folderObj instanceof TFolder ? folderObj : undefined,
			};
		});
	}

	private matchEncryptedFolderPath(vaultFolderPath: string, targetPlainPath: string, profile: CryptProfile): boolean {
		if (vaultFolderPath === targetPlainPath) return true;
		if (!profile.passphrase || profile.filenameEncryptionMode === 'off') return false;

		const vaultSegments = vaultFolderPath.split('/');
		const plainSegments = targetPlainPath.split('/');
		if (vaultSegments.length !== plainSegments.length) return false;

		for (let i = 0; i < vaultSegments.length; i++) {
			const encSeg = vaultSegments[i];
			const targetSeg = plainSegments[i];
			if (encSeg === targetSeg) continue;

			try {
				const decryptedSeg = this.plugin.engine.decryptName(encSeg, profile.passphrase, profile.salt, profile.id);
				if (decryptedSeg !== targetSeg) return false;
			} catch {
				return false;
			}
		}

		return true;
	}

	getItemText(item: MappedFolderItem): string {
		const t = getText();
		const status = item.folderObj ? '' : (t.encryptedOnDiskStatus || ' (Encrypted on disk)');
		return `${item.folderPath} (${item.profileName})${status}`;
	}

	onChooseItem(item: MappedFolderItem, _evt: MouseEvent | KeyboardEvent): void {
		const t = getText();
		if (item.folderObj) {
			void processItems(this.plugin, [item.folderObj], this.action, this.action === 'decrypt', item.profileId);
		} else {
			const msg = t.noticeMappedFolderNotFound
				? t.noticeMappedFolderNotFound(item.folderPath)
				: `⚠️ Mapped folder "${item.folderPath}" not found in vault.`;
			this.plugin.showNotice(msg);
		}
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
	private customSuffix = '.bin';
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
		const { containerEl, contentEl } = this;
		containerEl.addClass('rcrypt-modal');
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
					t.confirmEncryptCustomDesc
						? t.confirmEncryptCustomDesc(totalFiles)
						: `Are you sure you want to encrypt ${totalFiles} item(s) using Custom Configuration?`
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
					btn.setIcon('eye').setTooltip(t.showHidePassphraseTooltip || 'Show/hide passphrase').onClick(() => {
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
					btn.setIcon('eye').setTooltip(t.showHideSaltTooltip || 'Show/hide salt').onClick(() => {
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
					if (encodingSetting !== undefined) {
						encodingSetting.settingEl.style.display = this.customMode === 'standard' ? '' : 'none';
					}
					if (suffixSetting !== undefined) {
						suffixSetting.settingEl.style.display = this.customMode === 'off' ? '' : 'none';
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
						d.addOption('base32768', t.encodingBase32768 || 'Base32768 (Compact UTF-16)');
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
						text.setPlaceholder('.bin');
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
						: selectedProfile.filenameEncoding === 'base32768'
						? (t.encodingBase32768 || 'Base32768 (Compact UTF-16)')
						: t.encodingBase32;

				const modeDiv = infoDiv.createDiv();
				modeDiv.createSpan({ text: t.confirmEncryptFilenameModeLabel || 'Filename mode: ' });
				modeDiv.createEl('strong', { text: modeLabel });

				const encodingDiv = infoDiv.createDiv();
				encodingDiv.setCssProps({ marginTop: '4px' });
				encodingDiv.createSpan({ text: t.confirmEncryptFilenameEncodingLabel || 'Filename encoding: ' });
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
				dropdown.addOption('custom', t.customProfileOption || 'Custom...');
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

		const warningBox = contentEl.createDiv({ cls: 'rcrypt-modal-warning' });
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
							name: t.customProfileName || 'Custom Configuration',
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

export class FolderInputSuggest extends AbstractInputSuggest<TFolder> {
	private textInputEl: HTMLInputElement;

	constructor(app: App, textInputEl: HTMLInputElement) {
		super(app, textInputEl);
		this.textInputEl = textInputEl;
	}

	getSuggestions(inputStr: string): TFolder[] {
		const lowerInput = inputStr.toLowerCase();
		return this.app.vault
			.getAllLoadedFiles()
			.filter(
				(f): f is TFolder =>
					f instanceof TFolder &&
					f.path !== '/' &&
					f.path.toLowerCase().contains(lowerInput)
			);
	}

	renderSuggestion(folder: TFolder, el: HTMLElement): void {
		el.setText(folder.path);
	}

	selectSuggestion(folder: TFolder): void {
		this.textInputEl.value = folder.path;
		this.textInputEl.dispatchEvent(new Event('input', { bubbles: true }));
		this.close();
	}
}

export class ProgressModal extends Modal {
	private action: 'encrypt' | 'decrypt';
	private total: number;
	private current = 0;
	private currentFile = '';
	private isCancelled = false;

	private statusEl!: HTMLDivElement;
	private fileEl!: HTMLDivElement;
	private progressEl!: HTMLProgressElement;

	constructor(app: App, action: 'encrypt' | 'decrypt', total: number) {
		super(app);
		this.action = action;
		this.total = total;
	}

	onOpen(): void {
		const { contentEl } = this;
		const t = getText();
		const icon = this.action === 'encrypt' ? '🔒' : '🔓';
		const actionTitle = this.action === 'encrypt' ? (t.progressEncrypting || 'Encrypting') : (t.progressDecrypting || 'Decrypting');
		const modalTitle = t.progressTitle ? t.progressTitle(icon, actionTitle, this.total) : `${icon} ${actionTitle} ${this.total} item(s)...`;
		this.setTitle(modalTitle);

		contentEl.empty();

		this.statusEl = contentEl.createDiv({ cls: 'rcrypt-progress-status' });
		const statusText = t.progressStatus ? t.progressStatus(0, this.total, 0) : `Processing 0 of ${this.total} (0%)...`;
		this.statusEl.setText(statusText);
		this.statusEl.setCssProps({ marginBottom: '8px', fontWeight: 'bold' });

		this.fileEl = contentEl.createDiv({ cls: 'rcrypt-progress-file' });
		this.fileEl.setText('');
		this.fileEl.setCssProps({
			fontSize: '12px',
			color: 'var(--text-muted)',
			marginBottom: '12px',
			fontFamily: 'var(--font-monospace)',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
		});

		this.progressEl = contentEl.createEl('progress');
		this.progressEl.max = this.total;
		this.progressEl.value = 0;
		this.progressEl.setCssProps({ width: '100%', marginBottom: '15px' });

		const cancelBtnSetting = new Setting(contentEl);
		cancelBtnSetting.addButton((btn) => {
			btn.setButtonText(t.cancelBtn || 'Cancel').setWarning().onClick(() => {
				this.isCancelled = true;
				btn.setDisabled(true);
				btn.setButtonText(t.progressCancelling || 'Cancelling...');
				this.statusEl.setText(t.progressCancellingStatus || '⚠️ cancelling operation...');
			});
		});
	}

	public updateProgress(current: number, filename: string): void {
		const t = getText();
		this.current = current;
		this.currentFile = filename;
		const pct = Math.round((current / this.total) * 100);

		if (this.statusEl) {
			const statusText = t.progressStatus ? t.progressStatus(current, this.total, pct) : `Processing ${current} of ${this.total} (${pct}%)...`;
			this.statusEl.setText(statusText);
		}
		if (this.fileEl) {
			const fileText = t.progressCurrentFile ? t.progressCurrentFile(filename) : `Current: ${filename}`;
			this.fileEl.setText(fileText);
		}
		if (this.progressEl) {
			this.progressEl.value = current;
		}
	}

	public checkCancelled(): boolean {
		return this.isCancelled;
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
