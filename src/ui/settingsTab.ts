import { App, PluginSettingTab, Setting } from 'obsidian';
import { getText } from '../i18n/i18n';
import RCryptPlugin from '../main';
import { CryptProfile, DEFAULT_PROFILE, getFolderEncryptionMode } from '../types';
import { FolderInputSuggest } from './modals';

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

		// Password hint
		new Setting(containerEl)
			.setName('Password hint')
			.setDesc('Optional hint to help remember your passphrase during decryption prompts.')
			.addText((text) => {
				text
					.setPlaceholder('Enter password hint (optional)...')
					.setValue(activeProfile.passphraseHint || '')
					.onChange(async (value) => {
						activeProfile.passphraseHint = value;
						await this.plugin.saveSettings();
					});
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
						updateModeVisibility();
						await this.plugin.saveSettings();
					});
			});

		// Filename Encoding
		const encodingSetting = new Setting(containerEl)
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

		const updateModeVisibility = (): void => {
			const isOff = activeProfile.filenameEncryptionMode === 'off';
			encodingSetting.settingEl.style.display = isOff ? 'none' : '';
			suffixSetting.settingEl.style.display = isOff ? '' : 'none';
		};

		updateModeVisibility();

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

		// --- FOLDER PROFILE MAPPINGS SECTION ---
		new Setting(containerEl)
			.setName('Folder profile mappings')
			.setDesc('Assign specific crypt profiles to designated folder paths (e.g. "Private/Journal"). Files inside will automatically use the mapped profile.')
			.addButton((btn) => {
				btn.setButtonText('+ Add folder mapping').onClick(async () => {
					this.plugin.settings.folderMappings.push({
						folderPath: '',
						profileId: activeProfile.id,
					});
					await this.plugin.saveSettings();
					this.display();
				});
			});

		this.plugin.settings.folderMappings.forEach((mapping, index) => {
			const setting = new Setting(containerEl);

			setting.addText((text) => {
				text
					.setPlaceholder('Folder path (e.g. Private/Journal)')
					.setValue(mapping.folderPath)
					.onChange(async (val) => {
						mapping.folderPath = val.trim();
						await this.plugin.saveSettings();
					});
				new FolderInputSuggest(this.app, text.inputEl);
			});

			setting.addDropdown((dropdown) => {
				for (const p of this.plugin.settings.profiles) {
					dropdown.addOption(p.id, p.name);
				}
				dropdown.setValue(mapping.profileId).onChange(async (val) => {
					mapping.profileId = val;
					await this.plugin.saveSettings();
				});
			});

			setting.addButton((btn) => {
				btn
					.setIcon('trash')
					.setTooltip('Delete mapping')
					.onClick(async () => {
						this.plugin.settings.folderMappings.splice(index, 1);
						await this.plugin.saveSettings();
						this.display();
					});
			});
		});
	}
}
