import { Plugin } from 'obsidian';
import { registerContextMenu } from './contextMenu/registerMenu';
import { obscurePassword, revealPassword } from './crypto/obscure';
import { RCryptEngine } from './crypto/rcryptEngine';
import { DEFAULT_SETTINGS, RCryptSettings } from './types';
import { RCryptSettingTab } from './ui/settingsTab';

export default class RCryptPlugin extends Plugin {
	settings: RCryptSettings = DEFAULT_SETTINGS;
	engine!: RCryptEngine;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.engine = new RCryptEngine(this.settings);

		this.addSettingTab(new RCryptSettingTab(this.app, this));

		registerContextMenu(this);
	}

	onunload(): void {
		// Clean up on unload
	}

	async loadSettings(): Promise<void> {
		const loadedData = (await this.loadData()) as Partial<RCryptSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

		// Automatically reveal obscured passphrase and salt from data.json into RAM
		if (this.settings.passphrase) {
			this.settings.passphrase = revealPassword(this.settings.passphrase);
		}
		if (this.settings.salt) {
			this.settings.salt = revealPassword(this.settings.salt);
		}
	}

	async saveSettings(): Promise<void> {
		// Store obscured credentials in data.json on disk so raw plain-text is never saved
		const dataToSave: RCryptSettings = {
			...this.settings,
			passphrase: obscurePassword(this.settings.passphrase),
			salt: obscurePassword(this.settings.salt),
		};

		await this.saveData(dataToSave);
		if (this.engine) {
			this.engine.updateSettings(this.settings);
		}
	}
}
