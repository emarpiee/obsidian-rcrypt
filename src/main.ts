import { App, Notice, Plugin, TFile } from 'obsidian';
import './main.css';
import { executeBatchAction, processItems, registerContextMenu } from './contextMenu/registerMenu';
import { obscurePassword, revealPassword } from './crypto/obscure';
import { RCryptEngine } from './crypto/rcryptEngine';
import { getText } from './i18n/i18n';
import { CryptProfile, DEFAULT_PROFILE, DEFAULT_SETTINGS, RCryptSettings } from './types';
import { EncryptSuggestModal, MappedFolderSuggestModal } from './ui/modals';
import { RCryptLockView, VIEW_TYPE_RCRYPT } from './ui/rcryptLockView';
import { RCryptSettingTab } from './ui/settingsTab';

interface AppWithOpenWithDefaultApp extends App {
	openWithDefaultApp?: (path: string) => Promise<unknown> | void;
}

export default class RCryptPlugin extends Plugin {
	settings: RCryptSettings = DEFAULT_SETTINGS;
	engine!: RCryptEngine;
	updateDynamicCommands?: () => void;
	sessionDecryptedMap = new Map<string, { profile: CryptProfile }>();
	private activeNotice: Notice | null = null;

	showNotice(message: string, durationMs = 8000): void {
		if (this.activeNotice) {
			this.activeNotice.hide();
		}
		this.activeNotice = new Notice(message, durationMs);
	}

	registerDecryptedSessionFile(path: string, profile: CryptProfile): void {
		this.sessionDecryptedMap.set(path, { profile });
	}

	async checkAndAutoEncryptClosedFiles(): Promise<void> {
		if (this.sessionDecryptedMap.size === 0) return;

		const openPaths = new Set<string>();
		this.app.workspace.iterateAllLeaves((leaf) => {
			const viewState = leaf.getViewState();
			const filePath = (viewState.state as { file?: string })?.file;
			if (filePath) {
				openPaths.add(filePath);
			}
		});

		for (const [decryptedPath, sessionData] of Array.from(this.sessionDecryptedMap.entries())) {
			if (!openPaths.has(decryptedPath)) {
				const file = this.app.vault.getAbstractFileByPath(decryptedPath);
				if (file instanceof TFile) {
					const prof = sessionData.profile;
					if (prof.autoEncryptOnClose) {
						this.sessionDecryptedMap.delete(decryptedPath);
						void (async (): Promise<void> => {
							const t = getText();
							if (!prof.passphrase) {
								const msg = t.noticeReencryptPrompt
									? t.noticeReencryptPrompt(file.name)
									: `🔑 Please enter password to re-encrypt ${file.name}`;
								this.showNotice(msg, 10000);
								await processItems(this, [file], 'encrypt', true, prof.id);
							} else {
								const res = await executeBatchAction(
									this,
									[file],
									'encrypt',
									prof.passphrase,
									prof.salt,
									prof
								);
								if (res.successCount > 0) {
									const msg = t.noticeFileLocked
										? t.noticeFileLocked(file.name)
										: `🔒 Locked ${file.name}`;
									this.showNotice(msg, 8000);
								}
							}
						})();
					} else {
						this.sessionDecryptedMap.delete(decryptedPath);
					}
				} else {
					this.sessionDecryptedMap.delete(decryptedPath);
				}
			}
		}
	}

	async onload(): Promise<void> {
		await this.loadSettings();

		this.engine = new RCryptEngine(this.settings);

		// Register dummy view for encrypted files to prevent Obsidian from parsing or auto-saving binary ciphertext
		this.registerView(
			VIEW_TYPE_RCRYPT,
			(leaf) => new RCryptLockView(leaf)
		);

		// Register encrypted file extensions with Obsidian to use RCryptLockView
		try {
			const exts = new Set<string>(['rcrypt']);
			for (const p of this.settings.profiles) {
				const ext = (p.encryptedExtension || '.rcrypt').replace(/^\.+/, '').toLowerCase();
				if (ext && ext !== 'none') {
					exts.add(ext);
				}
			}
			this.registerExtensions(Array.from(exts), VIEW_TYPE_RCRYPT);
		} catch {
			// Extension already registered or handled
		}

		this.addSettingTab(new RCryptSettingTab(this.app, this));

		// Register "Clear Session Passphrases" command to purge RAM session passphrases on demand
		this.addCommand({
			id: 'clear-session-passphrases',
			name: getText().lockVaultName || 'Clear session password & salt from memory',
			callback: () => {
				for (const p of this.settings.profiles) {
					if (!p.savePassphraseOnDisk) {
						p.passphrase = '';
						p.salt = '';
					}
				}
				if (this.engine) {
					this.engine.updateSettings(this.settings);
				}
				// Refresh settings tab if it is currently open in Obsidian
				const settingTab = (this.app as unknown as { setting?: { activeTab?: { plugin?: unknown; display?: () => void } } }).setting;
				if (settingTab?.activeTab?.plugin === this && typeof settingTab.activeTab.display === 'function') {
					settingTab.activeTab.display();
				}
				this.showNotice(getText().lockVaultNotice || '🧹 Session password & salt cleared from memory.', 8000);
			},
		});

		// Function to update command display names dynamically with active profile
		const updateDynamicCommands = (): void => {
			const activeProfile = this.engine ? this.engine.getActiveProfile() : null;
			const profileName = activeProfile ? activeProfile.name : 'Standard';

			const suggestBase = getText().encryptSuggestCommandName || 'Encrypt specific file/folder';
			const activeFileBase = getText().encryptActiveFileCommandName || 'Encrypt active file';

			const suggestCmd = (this.app as unknown as { commands?: { commands?: Record<string, { name: string }> } }).commands?.commands?.['obsidian-rcrypt:encrypt-file-folder-suggest'];
			if (suggestCmd) {
				suggestCmd.name = `${suggestBase} (${profileName})`;
			}

			const activeFileCmd = (this.app as unknown as { commands?: { commands?: Record<string, { name: string }> } }).commands?.commands?.['obsidian-rcrypt:encrypt-active-file'];
			if (activeFileCmd) {
				activeFileCmd.name = `${activeFileBase} (${profileName})`;
			}
		};

		// Register "Encrypt specific file/folder" suggest modal command
		const activeProfileName = this.engine ? this.engine.getActiveProfile().name : 'Standard';
		const suggestBaseName = getText().encryptSuggestCommandName || 'Encrypt specific file/folder';
		this.addCommand({
			id: 'encrypt-file-folder-suggest',
			name: `${suggestBaseName} (${activeProfileName})`,
			callback: () => {
				new EncryptSuggestModal(this.app, this).open();
			},
		});

		// Register "Encrypt active file" command
		const activeFileBaseName = getText().encryptActiveFileCommandName || 'Encrypt active file';
		this.addCommand({
			id: 'encrypt-active-file',
			name: `${activeFileBaseName} (${activeProfileName})`,
			checkCallback: (checking) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						const resolvedProfile = this.engine.getProfileForPath(activeFile.path);
						void processItems(this, [activeFile], 'encrypt', false, resolvedProfile.id);
					}
					return true;
				}
				return false;
			},
		});

		// Register "Encrypt mapped folder..." command
		this.addCommand({
			id: 'encrypt-mapped-folder-suggest',
			name: getText().encryptMappedFolderCommandName || 'Encrypt mapped folder...',
			callback: () => {
				new MappedFolderSuggestModal(this.app, this, 'encrypt').open();
			},
		});

		// Register "Decrypt mapped folder..." command
		this.addCommand({
			id: 'decrypt-mapped-folder-suggest',
			name: getText().decryptMappedFolderCommandName || 'Decrypt mapped folder...',
			callback: () => {
				new MappedFolderSuggestModal(this.app, this, 'decrypt').open();
			},
		});

		this.updateDynamicCommands = updateDynamicCommands;

		// Intercept openWithDefaultApp so system "Open with..." modal is NEVER shown for encrypted files
		const targetApp = this.app as AppWithOpenWithDefaultApp;
		if (typeof targetApp.openWithDefaultApp === 'function') {
			const originalOpenWithDefaultApp = targetApp.openWithDefaultApp.bind(targetApp);
			targetApp.openWithDefaultApp = async (path: string): Promise<unknown> => {
				const file = this.app.vault.getAbstractFileByPath(path);
				if (file instanceof TFile) {
					const activeProfile = this.engine.getActiveProfile();
					const suffix = getEffectiveSuffix(activeProfile.encryptedExtension, activeProfile.filenameEncryptionMode);
					const isEncrypted =
						file.name.endsWith('.rcrypt') ||
						(suffix !== '' && file.name.endsWith(suffix)) ||
						(await hasRcloneHeader(this.app, file));

					if (isEncrypted) {
						void processItems(this, [file], 'decrypt', true, activeProfile.id);
						return;
					}
				}
				return originalOpenWithDefaultApp(path);
			};
			this.register(() => {
				targetApp.openWithDefaultApp = originalOpenWithDefaultApp;
			});
		}

		// Auto-detect opening an encrypted file to trigger decrypt modal flow
		let isHandlingFileOpen = false;
		this.registerEvent(
			this.app.workspace.on('file-open', async (file: TFile | null) => {
				if (!file || isHandlingFileOpen) return;

				const activeProfile = this.engine.getActiveProfile();
				const suffix = getEffectiveSuffix(activeProfile.encryptedExtension, activeProfile.filenameEncryptionMode);

				const isEncrypted =
					file.name.endsWith('.rcrypt') ||
					(suffix !== '' && file.name.endsWith(suffix)) ||
					(await hasRcloneHeader(this.app, file));

				if (isEncrypted) {
					isHandlingFileOpen = true;
					try {
						// Immediately detach any leaf that opened this encrypted file to prevent raw text parsing or auto-save corruption
						this.app.workspace.iterateAllLeaves((leaf) => {
							const state = leaf.getViewState();
							if ((state.state as { file?: string })?.file === file.path) {
								leaf.detach();
							}
						});

						// Open decryption modal (always prompt passphrase modal)
						void processItems(this, [file], 'decrypt', true, activeProfile.id);
					} finally {
						window.setTimeout(() => {
							isHandlingFileOpen = false;
						}, 500);
					}
				}
			})
		);

		// Capture clicks on File Explorer items for encrypted files (including files without extensions or with arbitrary encrypted names).
		// Uses a positive match against all registered encrypted extensions — NOT an inverted allowlist —
		// so unrecognised Obsidian-native extensions (e.g. .bases, .txt, .json) are never intercepted.
		this.registerDomEvent(
			document,
			'click',
			(evt: MouseEvent) => {
				const targetEl = (evt.target as HTMLElement).closest('[data-path]');
				if (!targetEl) return;

				const path = targetEl.getAttribute('data-path');
				if (!path) return;

				const abstractFile = this.app.vault.getAbstractFileByPath(path);
				if (!(abstractFile instanceof TFile)) return;

				const activeProfile = this.engine.getActiveProfile();
				const suffix = getEffectiveSuffix(activeProfile.encryptedExtension, activeProfile.filenameEncryptionMode);
				const ext = abstractFile.extension ? abstractFile.extension.toLowerCase() : '';

				// Build a positive set of every encrypted extension registered across all profiles
				const registeredEncryptedExts = new Set<string>(
					this.settings.profiles
						.map((p) => (p.encryptedExtension || '.rcrypt').replace(/^\.+/, '').toLowerCase())
						.filter((e) => e && e !== 'none')
				);
				registeredEncryptedExts.add('rcrypt');

				// Only intercept clicks on files whose extension positively matches a known encrypted extension.
				// Anything else is let through so Obsidian handles it natively.
				const isLikelyEncrypted =
					abstractFile.name.endsWith('.rcrypt') ||
					(suffix !== '' && abstractFile.name.endsWith(suffix)) ||
					registeredEncryptedExts.has(ext);

				if (!isLikelyEncrypted) return;

				const isNewTab = evt.ctrlKey || evt.metaKey || evt.button === 1;
				// MUST call preventDefault synchronously BEFORE any async execution to prevent OS Open With dialog
				evt.preventDefault();
				evt.stopPropagation();
				evt.stopImmediatePropagation();

				void (async (): Promise<void> => {
					const isEncrypted =
						abstractFile.name.endsWith('.rcrypt') ||
						(suffix !== '' && abstractFile.name.endsWith(suffix)) ||
						(await hasRcloneHeader(this.app, abstractFile));

					if (isEncrypted) {
						void processItems(this, [abstractFile], 'decrypt', true, activeProfile.id, isNewTab);
					} else {
						// File extension matched an encrypted extension pattern but the file is not actually
						// encrypted (e.g. a real .mp4 video when the user has configured .mp4 as encrypted ext).
						// Open via Obsidian's own API to restore native behaviour — NOT openWithDefaultApp,
						// which would hand the file off to the OS and bypass Obsidian's built-in viewers.
						const leaf = this.app.workspace.getLeaf(isNewTab);
						await leaf.openFile(abstractFile);
					}
				})();
			},
			true
		);

		registerContextMenu(this);

		// Register layout-change listener to auto re-encrypt closed decrypted tabs
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				void this.checkAndAutoEncryptClosedFiles();
			})
		);
	}

	onunload(): void {
		// Clean up RAM session credentials on unload
		for (const p of this.settings.profiles) {
			if (!p.savePassphraseOnDisk) {
				p.passphrase = '';
				p.salt = '';
			}
		}
	}

	async loadSettings(): Promise<void> {
		const loadedData = (await this.loadData()) as Partial<RCryptSettings> | Record<string, unknown> | null;
		
		// Legacy migration: if passphrase exists at root level of old settings, migrate into Default profile
		if (loadedData && 'passphrase' in loadedData && typeof loadedData.passphrase === 'string') {
			const oldPass = loadedData.passphrase;
			const oldSalt = typeof loadedData.salt === 'string' ? loadedData.salt : '';
			const oldMode = (loadedData.filenameEncryptionMode as 'standard' | 'obfuscate' | 'off') || 'standard';
			const oldEncoding = (loadedData.filenameEncoding as 'base32' | 'base64') || 'base32';
			const oldSuffix = (loadedData.encryptedExtension as string) || '.rcrypt';
			const oldFolderEnc = typeof loadedData.encryptFolderNames === 'boolean' ? loadedData.encryptFolderNames : false;

			const migratedDefaultProfile = {
				...DEFAULT_PROFILE,
				passphrase: revealPassword(oldPass),
				salt: revealPassword(oldSalt),
				filenameEncryptionMode: oldMode,
				filenameEncoding: oldEncoding,
				encryptedExtension: oldSuffix,
				encryptFolderNames: oldFolderEnc,
				savePassphraseOnDisk: false,
			};

			this.settings = {
				activeProfileId: 'default',
				profiles: [migratedDefaultProfile],
				folderMappings: [],
				autoDeleteSource: typeof loadedData.autoDeleteSource === 'boolean' ? loadedData.autoDeleteSource : true,
				rememberSessionPassphrase: true,
			};
			await this.saveSettings();
			return;
		}

		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

		if (!this.settings.profiles || this.settings.profiles.length === 0) {
			this.settings.profiles = [{ ...DEFAULT_PROFILE }];
			this.settings.activeProfileId = DEFAULT_PROFILE.id;
		}

		// Reveal obscured credentials for profiles saved on disk
		for (const p of this.settings.profiles) {
			if (p.savePassphraseOnDisk) {
				if (p.passphrase) {
					p.passphrase = revealPassword(p.passphrase);
				}
				if (p.salt) {
					p.salt = revealPassword(p.salt);
				}
			} else {
				// RAM only: initial session passphrase and salt start empty unless entered in session
				p.passphrase = '';
				p.salt = '';
			}
		}
	}

	async saveSettings(): Promise<void> {
		// Clone and obscure credentials for each profile before writing to data.json
		const obscuredProfiles = this.settings.profiles.map((p) => ({
			...p,
			// If savePassphraseOnDisk is false, store empty passphrase and salt strings on disk
			passphrase: p.savePassphraseOnDisk ? obscurePassword(p.passphrase) : '',
			salt: p.savePassphraseOnDisk ? obscurePassword(p.salt) : '',
		}));

		const dataToSave: RCryptSettings = {
			...this.settings,
			profiles: obscuredProfiles,
		};

		await this.saveData(dataToSave);
		if (this.engine) {
			this.engine.updateSettings(this.settings);
		}
		if (typeof this.updateDynamicCommands === 'function') {
			this.updateDynamicCommands();
		}
	}
}

async function hasRcloneHeader(app: App, file: TFile): Promise<boolean> {
	try {
		const buf = new Uint8Array(await app.vault.readBinary(file));
		if (buf.length >= 8) {
			return (
				buf[0] === 0x52 &&
				buf[1] === 0x43 &&
				buf[2] === 0x4c &&
				buf[3] === 0x4f &&
				buf[4] === 0x4e &&
				buf[5] === 0x45 &&
				buf[6] === 0x00 &&
				buf[7] === 0x00
			);
		}
	} catch {
		// Ignore binary read errors
	}
	return false;
}

function getEffectiveSuffix(configuredSuffix: string, mode: string): string {
	if (mode !== 'off') return '';
	if (configuredSuffix && configuredSuffix.toLowerCase() === 'none') return '';
	return configuredSuffix || '.bin';
}

