import { App, PluginSettingTab, Setting } from 'obsidian';
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

		containerEl.empty();

		new Setting(containerEl).setName('Vault encryption').setHeading();

		new Setting(containerEl)
			.setName('Default passphrase')
			.setDesc('Master passphrase used for 1-click encryption/decryption.')
			.addText((text) => {
				text
					.setPlaceholder('Enter master passphrase...')
					.setValue(this.plugin.settings.passphrase)
					.onChange(async (value) => {
						this.plugin.settings.passphrase = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.type = 'password';
			});

		new Setting(containerEl)
			.setName('Default salt (password2)')
			.setDesc(
				'Salt used alongside passphrase (corresponds to password2 in rclone.conf). Setting a custom salt is strongly recommended.'
			)
			.addText((text) => {
				text
					.setPlaceholder('rclone')
					.setValue(this.plugin.settings.salt)
					.onChange(async (value) => {
						this.plugin.settings.salt = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.type = 'password';
			});

		if (!this.plugin.settings.salt || this.plugin.settings.salt === 'rclone') {
			containerEl.createDiv({
				cls: 'notice rcrypt-warning-notice',
				text: '⚠️ Security notice: Using blank or default salt ("rclone") is weaker against rainbow table attacks. Consider setting a custom salt for maximum security.',
			});
		}

		new Setting(containerEl)
			.setName('Filename encryption mode')
			.setDesc('Mode matching crypt-filename-encryption in rclone.conf')
			.addDropdown((dropdown) => {
				dropdown
					.addOption('standard', 'Standard (AES-256 EME - Recommended)')
					.addOption('obfuscate', 'Obfuscate (Light rotation)')
					.addOption('off', 'Off (Filenames left in plaintext)')
					.setValue(this.plugin.settings.filenameEncryptionMode)
					.onChange(async (value) => {
						this.plugin.settings.filenameEncryptionMode = value as FilenameEncryptionMode;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Filename encoding')
			.setDesc('Text encoding matching filename_encoding in rclone.conf')
			.addDropdown((dropdown) => {
				dropdown
					.addOption('base32', 'Base32 (Standard lowercase)')
					.addOption('base64', 'Base64 (URL-safe, case-sensitive)')
					.setValue(this.plugin.settings.filenameEncoding)
					.onChange(async (value) => {
						this.plugin.settings.filenameEncoding = value as FilenameEncoding;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Encrypted file suffix')
			.setDesc('File extension appended to encrypted files')
			.addText((text) => {
				text
					.setPlaceholder('.rcrypt')
					.setValue(this.plugin.settings.encryptedExtension)
					.onChange(async (value) => {
						this.plugin.settings.encryptedExtension = value || '.rcrypt';
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Auto-delete source file')
			.setDesc('Automatically delete unencrypted file after successful encryption.')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.autoDeleteSource).onChange(async (value) => {
					this.plugin.settings.autoDeleteSource = value;
					await this.plugin.saveSettings();
				});
			});
	}
}
