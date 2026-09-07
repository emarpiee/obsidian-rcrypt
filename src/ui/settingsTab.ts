import { App, PluginSettingTab, Setting } from 'obsidian';
import { getText } from '../i18n/i18n';
import RCryptPlugin from '../main';
import { CryptProfile, DEFAULT_PROFILE, getFolderEncryptionMode } from '../types';

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

		// --- PROFILE MANAGER SECTION ---
		new Setting(containerEl)
			.setName(t.profileManagerName)
			.setDesc(t.profileManagerDesc)
			.addDropdown((dropdown) => {
				for (const profile of this.plugin.settings.profiles) {
					dropdown.addOption(profile.id, profile.name);
				}
				dropdown
					.setValue(this.plugin.settings.activeProfileId)
					.onChange(async (value) => {
						this.plugin.settings.activeProfileId = value;
						await this.plugin.saveSettings();
						this.display();
					});
			})
			.addButton((btn) => {
				btn
					.setButtonText(t.newProfileBtn)
					.setCta()
					.onClick(async () => {
						const newId = `profile_${Date.now()}`;
						const newProfile: CryptProfile = {
							...DEFAULT_PROFILE,
							id: newId,
							name: `Profile ${this.plugin.settings.profiles.length + 1}`,
						};
						this.plugin.settings.profiles.push(newProfile);
						this.plugin.settings.activeProfileId = newId;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		// Retrieve active profile
		const activeProfile =
			this.plugin.settings.profiles.find((p) => p.id === this.plugin.settings.activeProfileId) ||
			this.plugin.settings.profiles[0];

		if (!activeProfile) return;

		// Profile Name & Actions (Rename / Delete)
		const profileHeaderSetting = new Setting(containerEl)
			.setName(t.profileConfigHeader)
			.setHeading();

		profileHeaderSetting.addText((text) => {
			text
				.setPlaceholder('Profile name')
				.setValue(activeProfile.name)
				.onChange(async (val) => {
					activeProfile.name = val || 'Unnamed Profile';
					await this.plugin.saveSettings();
				});
		});

		if (this.plugin.settings.profiles.length > 1) {
			profileHeaderSetting.addButton((btn) => {
				btn
					.setButtonText(t.deleteProfileBtn)
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.profiles = this.plugin.settings.profiles.filter(
							(p) => p.id !== activeProfile.id
						);
						this.plugin.settings.activeProfileId = this.plugin.settings.profiles[0].id;
						await this.plugin.saveSettings();
						this.display();
					});
			});
		}

		// Password (for encryption)
		new Setting(containerEl)
			.setName(t.defaultPassphraseName)
			.setDesc(t.defaultPassphraseDesc)
			.addText((text) => {
				text
					.setPlaceholder(t.defaultPassphrasePlaceholder)
					.setValue(activeProfile.passphrase)
					.onChange(async (value) => {
						activeProfile.passphrase = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.type = 'password';
			});

		// Salt (password2)
		new Setting(containerEl)
			.setName(t.defaultSaltName)
			.setDesc(t.defaultSaltDesc)
			.addText((text) => {
				text
					.setPlaceholder(t.defaultSaltPlaceholder)
					.setValue(activeProfile.salt)
					.onChange(async (value) => {
						activeProfile.salt = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.type = 'password';
			});

		// Save Password On Disk Toggle
		new Setting(containerEl)
			.setName(t.savePassphraseOnDiskName || 'Save password on disk')
			.setDesc(t.savePassphraseOnDiskDesc || 'If disabled (recommended), passphrases are kept only in RAM for the current session and never stored on disk.')
			.addToggle((toggle) => {
				toggle.setValue(activeProfile.savePassphraseOnDisk ?? false).onChange(async (value) => {
					activeProfile.savePassphraseOnDisk = value;
					await this.plugin.saveSettings();
				});
			});

		// Filename Encryption Mode
		new Setting(containerEl)
			.setName(t.filenameEncryptionModeName)
			.setDesc(t.filenameEncryptionModeDesc)
			.addDropdown((dropdown) => {
				dropdown
					.addOption('standard', t.modeStandard)
					.addOption('obfuscate', t.modeObfuscate)
					.addOption('off', t.modeOff)
					.setValue(activeProfile.filenameEncryptionMode)
					.onChange(async (value: string) => {
						activeProfile.filenameEncryptionMode = value as 'standard' | 'obfuscate' | 'off';
						updateSuffixVisibility();
						await this.plugin.saveSettings();
					});
			});

		// Filename Encoding
		new Setting(containerEl)
			.setName(t.filenameEncodingName)
			.setDesc(t.filenameEncodingDesc)
			.addDropdown((dropdown) => {
				dropdown
					.addOption('base32', t.encodingBase32)
					.addOption('base64', t.encodingBase64)
					.setValue(activeProfile.filenameEncoding)
					.onChange(async (value: string) => {
						activeProfile.filenameEncoding = value as 'base32' | 'base64';
						await this.plugin.saveSettings();
					});
			});

		// Encrypted Extension (Suffix)
		const suffixSetting = new Setting(containerEl)
			.setName(t.encryptedSuffixName)
			.setDesc(t.encryptedSuffixDesc)
			.addText((text) => {
				text
					.setPlaceholder('.rcrypt')
					.setValue(activeProfile.encryptedExtension)
					.onChange(async (value) => {
						activeProfile.encryptedExtension = value || '.rcrypt';
						await this.plugin.saveSettings();
					});
			});

		const updateSuffixVisibility = (): void => {
			if (activeProfile.filenameEncryptionMode === 'off') {
				suffixSetting.settingEl.show();
			} else {
				suffixSetting.settingEl.hide();
			}
		};

		updateSuffixVisibility();

		// Folder Name Encryption
		new Setting(containerEl)
			.setName(t.folderEncryptionName || t.encryptFolderNamesName)
			.setDesc(t.folderEncryptionDesc || t.encryptFolderNamesDesc)
			.addDropdown((dropdown) => {
				dropdown
					.addOption('all', t.folderEncryptionAll || 'Target & all subfolders (Recommended)')
					.addOption('off', t.folderEncryptionOff || 'Off (Files only)')
					.setValue(getFolderEncryptionMode(activeProfile.encryptFolderNames))
					.onChange(async (value: string) => {
						activeProfile.encryptFolderNames = value as 'all' | 'off';
						await this.plugin.saveSettings();
					});
			});

		// --- OTHER OPTIONS SECTION ---
		new Setting(containerEl).setName(t.generalOptionsHeader);

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
