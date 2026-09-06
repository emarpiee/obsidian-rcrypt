import { Plugin } from 'obsidian';
import { registerContextMenu } from './contextMenu/registerMenu';
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
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		if (this.engine) {
			this.engine.updateSettings(this.settings);
		}
	}
}
