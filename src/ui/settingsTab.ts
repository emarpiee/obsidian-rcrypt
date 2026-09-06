import { App, PluginSettingTab, Setting } from 'obsidian';
import { getText } from '../i18n/i18n';
import RCryptPlugin from '../main';
import { FilenameEncoding, FilenameEncryptionMode } from '../types';

export class RCryptSettingTab extends PluginSettingTab {
	plugin: RCryptPlugin;

	constructor(app: App, plugin: RCryptPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const t = getText();

		containerEl.empty();

		new Setting(containerEl)
			.setName(t.settingsHeading)
			.setDesc(t.settingsHeadingDesc)
			.setHeading();

		new Setting(containerEl)
			.setName(t.defaultPassphraseName)
			.setDesc(t.defaultPassphraseDesc)
			.addText((text) => {
				text
					.setPlaceholder(t.defaultPassphrasePlaceholder)
					.setValue(this.plugin.settings.passphrase)
					.onChange(async (value) => {
						this.plugin.settings.passphrase = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.type = 'password';
			});

		new Setting(containerEl)
			.setName(t.defaultSaltName)
			.setDesc(
				t.defaultSaltDesc +
					(!this.plugin.settings.salt || this.plugin.settings.salt === 'rclone'
						? t.defaultSaltWarning
						: '')
			)
			.addText((text) => {
				text
					.setPlaceholder(t.defaultSaltPlaceholder)
					.setValue(this.plugin.settings.salt)
					.onChange(async (value) => {
						this.plugin.settings.salt = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.type = 'password';
			});

		new Setting(containerEl)
			.setName(t.filenameEncryptionModeName)
			.setDesc(t.filenameEncryptionModeDesc)
			.addDropdown((dropdown) => {
				dropdown
					.addOption('standard', t.modeStandard)
					.addOption('obfuscate', t.modeObfuscate)
					.addOption('off', t.modeOff)
					.setValue(this.plugin.settings.filenameEncryptionMode)
					.onChange(async (value) => {
						this.plugin.settings.filenameEncryptionMode = value as FilenameEncryptionMode;
						await this.plugin.saveSettings();
						updateSuffixVisibility();
					});
			});

		new Setting(containerEl)
			.setName(t.filenameEncodingName)
			.setDesc(t.filenameEncodingDesc)
			.addDropdown((dropdown) => {
				dropdown
					.addOption('base32', t.encodingBase32)
					.addOption('base64', t.encodingBase64)
					.setValue(this.plugin.settings.filenameEncoding)
					.onChange(async (value) => {
						this.plugin.settings.filenameEncoding = value as FilenameEncoding;
						await this.plugin.saveSettings();
					});
			});

		const suffixSetting = new Setting(containerEl)
			.setName(t.encryptedSuffixName)
			.setDesc(t.encryptedSuffixDesc)
			.addText((text) => {
				text
					.setPlaceholder('.bin')
					.setValue(this.plugin.settings.encryptedExtension)
					.onChange(async (value) => {
						this.plugin.settings.encryptedExtension = value || '.rcrypt';
						await this.plugin.saveSettings();
					});
			});

		const updateSuffixVisibility = () => {
			if (this.plugin.settings.filenameEncryptionMode === 'off') {
				suffixSetting.settingEl.show();
			} else {
				suffixSetting.settingEl.hide();
			}
		};

		updateSuffixVisibility();

		new Setting(containerEl)
			.setName(t.encryptFolderNamesName)
			.setDesc(t.encryptFolderNamesDesc)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.encryptFolderNames).onChange(async (value) => {
					this.plugin.settings.encryptFolderNames = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName(t.autoDeleteSourceName)
			.setDesc(t.autoDeleteSourceDesc)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.autoDeleteSource).onChange(async (value) => {
					this.plugin.settings.autoDeleteSource = value;
					await this.plugin.saveSettings();
				});
			});
	}
}
