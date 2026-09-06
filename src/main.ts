import { Notice, Plugin } from 'obsidian';
import './main.css';
import { registerContextMenu } from './contextMenu/registerMenu';
import { obscurePassword, revealPassword } from './crypto/obscure';
import { RCryptEngine } from './crypto/rcryptEngine';
import { getText } from './i18n/i18n';
import { DEFAULT_PROFILE, DEFAULT_SETTINGS, RCryptSettings } from './types';
import { RCryptSettingTab } from './ui/settingsTab';

export default class RCryptPlugin extends Plugin {
	settings: RCryptSettings = DEFAULT_SETTINGS;
	engine!: RCryptEngine;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.engine = new RCryptEngine(this.settings);

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
