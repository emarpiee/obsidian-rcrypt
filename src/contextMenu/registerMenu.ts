import { Menu, Notice, TAbstractFile, TFile, TFolder } from 'obsidian';
import { getText } from '../i18n/i18n';
import RCryptPlugin from '../main';
import { CryptProfile, getFolderEncryptionMode } from '../types';
import { ConfirmEncryptModal, PassphraseModal } from '../ui/modals';

export function registerContextMenu(plugin: RCryptPlugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
			addMenuItems(plugin, menu, [file]);
		})
	);

	plugin.registerEvent(
		plugin.app.workspace.on('files-menu', (menu: Menu, files: TAbstractFile[]) => {
			addMenuItems(plugin, menu, files);
		})
	);
}

function addMenuItems(plugin: RCryptPlugin, menu: Menu, files: TAbstractFile[]): void {
	if (!files || files.length === 0) return;

	const t = getText();
	const isFolder = files.length === 1 && files[0] instanceof TFolder;
	const count = files.length;

	const activeProfile = plugin.engine.getActiveProfile();

	// If there's only 1 profile, keep simple clean top-level items
	if (plugin.settings.profiles.length === 1) {
		menu.addItem((item) => {
			item
				.setTitle(
					count > 1
						? t.encryptItems(count)
						: isFolder
						? t.encryptFolder
						: t.encryptFile
				)
				.setIcon('lock')
				.onClick(() => {
					void processItems(plugin, files, 'encrypt', false, activeProfile.id);
				});
		});

		menu.addItem((item) => {
			item
				.setTitle(t.encryptCustomPassphrase)
				.setIcon('key')
				.onClick(() => {
					void processItems(plugin, files, 'encrypt', true);
				});
		});

		menu.addSeparator();

		menu.addItem((item) => {
			item
				.setTitle(
					count > 1
						? t.decryptItems(count)
						: isFolder
						? t.decryptFolder
						: t.decryptFile
				)
				.setIcon('unlock')
				.onClick(() => {
					void processItems(plugin, files, 'decrypt', false, activeProfile.id);
				});
		});

		menu.addItem((item) => {
			item
				.setTitle(t.decryptCustomPassphrase)
				.setIcon('key')
				.onClick(() => {
					void processItems(plugin, files, 'decrypt', true);
				});
		});

		return;
	}

	// Multiple profiles: group into native Submenus
	menu.addItem((item) => {
		item
			.setTitle(
				count > 1
					? t.encryptItems(count)
					: isFolder
					? t.encryptFolder
					: t.encryptFile
			)
			.setIcon('lock');

		const subMenu = item.setSubmenu();

		// Active profile first
		subMenu.addItem((subItem) => {
			subItem
				.setTitle(`${activeProfile.name} (Active)`)
				.setIcon('check')
				.onClick(() => {
					void processItems(plugin, files, 'encrypt', false, activeProfile.id);
				});
		});

		// Other profiles
		for (const p of plugin.settings.profiles) {
			if (p.id === activeProfile.id) continue;
			subMenu.addItem((subItem) => {
				subItem
					.setTitle(p.name)
					.setIcon('lock')
					.onClick(() => {
						void processItems(plugin, files, 'encrypt', false, p.id);
					});
			});
		}

		subMenu.addSeparator();

		// Custom Passphrase option inside submenu
		subMenu.addItem((subItem) => {
			subItem
				.setTitle(t.encryptCustomPassphrase)
				.setIcon('key')
				.onClick(() => {
					void processItems(plugin, files, 'encrypt', true);
				});
		});
	});

	menu.addItem((item) => {
		item
			.setTitle(
				count > 1
					? t.decryptItems(count)
					: isFolder
					? t.decryptFolder
					: t.decryptFile
			)
			.setIcon('unlock');

		const subMenu = item.setSubmenu();

		// Active profile first
		subMenu.addItem((subItem) => {
			subItem
				.setTitle(`${activeProfile.name} (Active)`)
				.setIcon('check')
				.onClick(() => {
					void processItems(plugin, files, 'decrypt', false, activeProfile.id);
				});
		});

		// Other profiles
		for (const p of plugin.settings.profiles) {
			if (p.id === activeProfile.id) continue;
			subMenu.addItem((subItem) => {
				subItem
					.setTitle(p.name)
					.setIcon('unlock')
					.onClick(() => {
						void processItems(plugin, files, 'decrypt', false, p.id);
					});
			});
		}

		subMenu.addSeparator();

		// Custom Passphrase option inside submenu
		subMenu.addItem((subItem) => {
			subItem
				.setTitle(t.decryptCustomPassphrase)
				.setIcon('key')
				.onClick(() => {
					void processItems(plugin, files, 'decrypt', true);
				});
		});
	});
}

export async function processItems(
	plugin: RCryptPlugin,
	items: TAbstractFile[],
	action: 'encrypt' | 'decrypt',
	useCustomPrompt: boolean,
	profileId?: string
): Promise<void> {
	const t = getText();
	const title = action === 'encrypt' ? t.modalTitleEncrypt(items.length) : t.modalTitleDecrypt(items.length);
	const targetProfile = profileId ? plugin.engine.getProfileById(profileId) || plugin.engine.getActiveProfile() : plugin.engine.getActiveProfile();

	const executeAction = async (): Promise<void> => {
		if (useCustomPrompt || !targetProfile.passphrase) {
			new PassphraseModal(
				plugin.app,
				title,
				plugin.settings.profiles,
				targetProfile.id,
				async (res) => {
					const selectedProfile = plugin.engine.getProfileById(res.profileId) || targetProfile;
					selectedProfile.passphrase = res.passphrase;
					selectedProfile.salt = res.salt;
					const result = await executeBatchAction(plugin, items, action, res.passphrase, res.salt, selectedProfile);
					return result.successCount > 0 && result.failCount === 0;
				}
			).open();
		} else {
			await executeBatchAction(
				plugin,
				items,
				action,
				targetProfile.passphrase,
				targetProfile.salt,
				targetProfile
			);
		}
	};

	if (action === 'encrypt') {
		new ConfirmEncryptModal(plugin.app, items, targetProfile, () => {
			void executeAction();
		}).open();
	} else {
		await executeAction();
	}
}

async function executeBatchAction(
	plugin: RCryptPlugin,
	items: TAbstractFile[],
	action: 'encrypt' | 'decrypt',
	passphrase: string,
	salt: string,
	profile: CryptProfile
): Promise<{ successCount: number; failCount: number }> {
	const t = getText();
	let successCount = 0;
	let failCount = 0;

	const allFiles: TFile[] = [];
	const topFolders: TFolder[] = [];
	const decryptedFiles: TFile[] = [];

	for (const item of items) {
		if (item instanceof TFile) {
			allFiles.push(item);
		} else if (item instanceof TFolder) {
			topFolders.push(item);
			collectFolderFiles(item, allFiles);
		}
	}

	let firstErrorMessage = '';

	for (const file of allFiles) {
		try {
			if (action === 'encrypt') {
				const isAlreadyEncrypted = isEncryptedFilename(file.name, profile.encryptedExtension, profile.filenameEncryptionMode);
				if (isAlreadyEncrypted) {
					continue;
				}
				const content = new Uint8Array(await plugin.app.vault.readBinary(file));
				const encryptedBytes = plugin.engine.encryptFile(content, passphrase, salt, profile.id);

				const encName = plugin.engine.encryptName(file.name, passphrase, salt, profile.id);
				const suffix = getEffectiveSuffix(profile.encryptedExtension, profile.filenameEncryptionMode);
				const targetPath = `${file.parent ? file.parent.path + '/' : ''}${encName}${suffix}`;

				await plugin.app.vault.createBinary(
					targetPath,
					toArrayBuffer(encryptedBytes)
				);

				if (plugin.settings.autoDeleteSource) {
					await plugin.app.vault.delete(file, true);
				}
				successCount++;
			} else {
				// Decrypt action
				const suffix = getEffectiveSuffix(profile.encryptedExtension, profile.filenameEncryptionMode);
				let rawEncName = file.name;

				if (suffix && file.name.endsWith(suffix)) {
					rawEncName = file.name.slice(0, -suffix.length);
				}

				let decName = rawEncName;

				// Read file content first
				const content = new Uint8Array(await plugin.app.vault.readBinary(file));

				// 1. Decrypt filename if filename encryption mode is enabled ('standard' or 'obfuscate')
				if (profile.filenameEncryptionMode !== 'off') {
					try {
						decName = plugin.engine.decryptName(rawEncName, passphrase, salt, profile.id);
					} catch {
						// If filename decryption fails under standard/obfuscate mode, test if payload decrypts with plain filename
						try {
							plugin.engine.decryptFile(content, passphrase, salt, profile.id);
							decName = rawEncName; // Plain filename
						} catch {
							throw new Error('Incorrect passphrase, salt, or filename mode.');
						}
					}
				}

				// 2. Decrypt file payload strictly using selected profile
				const decryptedBytes = plugin.engine.decryptFile(content, passphrase, salt, profile.id);

				// 3. Save decrypted file
				const parentDir = file.parent && file.parent.path !== '/' ? `${file.parent.path}/` : '';
				const targetPath = `${parentDir}${decName}`;
				let decryptedFileObj: TFile | null = null;

				if (targetPath === file.path) {
					// In-place decryption
					await plugin.app.vault.modifyBinary(file, toArrayBuffer(decryptedBytes));
					decryptedFileObj = file;
				} else {
					const existingTarget = plugin.app.vault.getAbstractFileByPath(targetPath);
					if (existingTarget instanceof TFile) {
						await plugin.app.vault.modifyBinary(existingTarget, toArrayBuffer(decryptedBytes));
						if (plugin.settings.autoDeleteSource) {
							await plugin.app.vault.delete(file, true);
						}
						decryptedFileObj = existingTarget;
					} else {
						decryptedFileObj = await plugin.app.vault.createBinary(
							targetPath,
							toArrayBuffer(decryptedBytes)
						);
						if (plugin.settings.autoDeleteSource) {
							await plugin.app.vault.delete(file, true);
						}
					}
				}
				if (decryptedFileObj) {
					decryptedFiles.push(decryptedFileObj);
				}
				successCount++;
			}
		} catch (err: unknown) {
			failCount++;
			if (!firstErrorMessage) {
				firstErrorMessage = err instanceof Error ? err.message : 'Unknown error';
			}
		}
	}

	if (action === 'decrypt' && decryptedFiles.length > 0) {
		const leaf = plugin.app.workspace.getLeaf(false);
		if (leaf) {
			void leaf.openFile(decryptedFiles[0]);
		}
	}

	// Rename target folder(s) if folder name encryption is enabled
	const folderEncMode = getFolderEncryptionMode(profile.encryptFolderNames);
	if (folderEncMode !== 'off' && topFolders.length > 0) {
		const foldersToRename: TFolder[] = [];
		if (folderEncMode === 'all') {
			for (const topFolder of topFolders) {
				collectFoldersPostOrder(topFolder, foldersToRename);
			}
		} else {
			foldersToRename.push(...topFolders);
		}

		for (const folder of foldersToRename) {
			try {
				if (action === 'encrypt') {
					const encFolderName = plugin.engine.encryptName(folder.name, passphrase, salt, profile.id);
					const parentPath = folder.parent ? folder.parent.path : '';
					const targetFolderPath = parentPath && parentPath !== '/' ? `${parentPath}/${encFolderName}` : encFolderName;
					if (targetFolderPath !== folder.path) {
						await plugin.app.fileManager.renameFile(folder, targetFolderPath);
					}
				} else if (profile.filenameEncryptionMode !== 'off') {
					let decFolderName = folder.name;
					try {
						decFolderName = plugin.engine.decryptName(folder.name, passphrase, salt, profile.id);
					} catch {
						// Ignore if folder name wasn't encrypted
					}

					if (decFolderName !== folder.name) {
						const parentPath = folder.parent ? folder.parent.path : '';
						const targetFolderPath = parentPath && parentPath !== '/' ? `${parentPath}/${decFolderName}` : decFolderName;
						if (targetFolderPath !== folder.path) {
							await plugin.app.fileManager.renameFile(folder, targetFolderPath);
						}
					}
				}
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : 'Folder rename error';
				console.error(`Error renaming folder ${folder.path}: ${msg}`);
			}
		}
	}

	if (successCount > 0 || failCount > 0) {
		if (failCount > 0 && successCount === 0) {
			new Notice(
				action === 'encrypt'
					? t.noticeEncryptFailed(failCount, firstErrorMessage)
					: t.noticeDecryptFailed(failCount, firstErrorMessage),
				10000
			);
		} else if (failCount > 0) {
			new Notice(
				t.noticeActionFinishedWithErrors(action, successCount, failCount, firstErrorMessage),
				10000
			);
		} else {
			new Notice(
				action === 'encrypt'
					? t.noticeEncryptSuccess(successCount)
					: t.noticeDecryptSuccess(successCount),
				6000
			);
		}
	} else {
		// Informative notice when no items were modified (e.g. already encrypted/decrypted)
		if (allFiles.length === 0) {
			new Notice(t.noticeNoFilesFound, 5000);
		} else if (action === 'encrypt') {
			new Notice(t.noticeAlreadyEncrypted, 5000);
		} else {
			new Notice(t.noticeAlreadyDecrypted, 5000);
		}
	}

	return { successCount, failCount };
}

function toArrayBuffer(uint8: Uint8Array): ArrayBuffer {
	return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer;
}

function collectFolderFiles(folder: TFolder, out: TFile[]): void {
	for (const child of folder.children) {
		if (child instanceof TFile) {
			out.push(child);
		} else if (child instanceof TFolder) {
			collectFolderFiles(child, out);
		}
	}
}

function getEffectiveSuffix(configuredSuffix: string, mode: string): string {
	if (mode !== 'off') {
		return '';
	}
	if (configuredSuffix && configuredSuffix.toLowerCase() === 'none') {
		return '';
	}
	return configuredSuffix || '.bin';
}

function isEncryptedFilename(filename: string, configuredSuffix: string, mode: string): boolean {
	if (mode === 'off') {
		const suffix = getEffectiveSuffix(configuredSuffix, mode);
		return suffix ? filename.endsWith(suffix) : false;
	}
	return false;
}

function collectFoldersPostOrder(folder: TFolder, out: TFolder[]): void {
	for (const child of folder.children) {
		if (child instanceof TFolder) {
			collectFoldersPostOrder(child, out);
		}
	}
	out.push(folder);
}

