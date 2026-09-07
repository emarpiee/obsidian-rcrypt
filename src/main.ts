import { App, Notice, Plugin, TFile } from 'obsidian';
import './main.css';
import { processItems, registerContextMenu } from './contextMenu/registerMenu';
import { obscurePassword, revealPassword } from './crypto/obscure';
import { RCryptEngine } from './crypto/rcryptEngine';
import { getText } from './i18n/i18n';
import { DEFAULT_PROFILE, DEFAULT_SETTINGS, RCryptSettings } from './types';
import { EncryptSuggestModal } from './ui/modals';
import { RCryptSettingTab } from './ui/settingsTab';

interface AppWithOpenWithDefaultApp extends App {
	openWithDefaultApp?: (path: string) => Promise<unknown> | void;
}

export default class RCryptPlugin extends Plugin {
	settings: RCryptSettings = DEFAULT_SETTINGS;
	engine!: RCryptEngine;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.engine = new RCryptEngine(this.settings);

		// Register encrypted file extensions with Obsidian so clicking them opens inside Obsidian workspace instead of OS "Open with..." dialog
		try {
			const exts = new Set<string>(['rcrypt']);
			for (const p of this.settings.profiles) {
				const ext = (p.encryptedExtension || '.rcrypt').replace(/^\.+/, '').toLowerCase();
				if (ext && ext !== 'none') {
					exts.add(ext);
				}
			}
			this.registerExtensions(Array.from(exts), 'markdown');
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
				new Notice(getText().lockVaultNotice || '🧹 Session password & salt cleared from memory.', 5000);
			},
		});

		// Register "Encrypt specific file/folder" suggest modal command
		this.addCommand({
			id: 'encrypt-file-folder-suggest',
			name: getText().encryptSuggestCommandName || 'Encrypt specific file/folder (active profile)',
			callback: () => {
				new EncryptSuggestModal(this.app, this).open();
			},
		});

		// Register "Encrypt active file" command
		this.addCommand({
			id: 'encrypt-active-file',
			name: getText().encryptActiveFileCommandName || 'Encrypt active file (active profile)',
			checkCallback: (checking) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						const activeProfile = this.engine.getActiveProfile();
						void processItems(this, [activeFile], 'encrypt', false, activeProfile.id);
					}
					return true;
				}
				return false;
			},
		});

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

		// Capture clicks on File Explorer items for encrypted files (including files without extensions or with arbitrary encrypted names)
		const knownObsidianExts = new Set(['md', 'canvas', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'mp3', 'mp4', 'pdf', 'webp']);

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

				const isLikelyEncrypted =
					!knownObsidianExts.has(ext) ||
					abstractFile.name.endsWith('.rcrypt') ||
					(suffix !== '' && abstractFile.name.endsWith(suffix));

				if (isLikelyEncrypted) {
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
							void processItems(this, [abstractFile], 'decrypt', true, activeProfile.id);
						} else if (targetApp.openWithDefaultApp) {
							// Fallback to default app if not actually encrypted
							void targetApp.openWithDefaultApp(abstractFile.path);
						}
					})();
				}
			},
			true
		);

		registerContextMenu(this);
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

