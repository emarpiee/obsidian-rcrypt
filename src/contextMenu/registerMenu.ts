import { Menu, Notice, TAbstractFile, TFile, TFolder } from 'obsidian';
import { getText } from '../i18n/i18n';
import RCryptPlugin from '../main';
import { PassphraseModal } from '../ui/modals';

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

	// Encrypt options
	menu.addItem((item) => {
		item
			.setTitle(count > 1 ? t.encryptItems(count) : (isFolder ? t.encryptFolder : t.encryptFile))
			.setIcon('lock')
			.onClick(() => {
				void processItems(plugin, files, 'encrypt', false);
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

	// Decrypt options
	menu.addItem((item) => {
		item
			.setTitle(count > 1 ? t.decryptItems(count) : (isFolder ? t.decryptFolder : t.decryptFile))
			.setIcon('unlock')
			.onClick(() => {
				void processItems(plugin, files, 'decrypt', false);
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
}

function isEncryptedItem(plugin: RCryptPlugin, file: TAbstractFile): boolean {
	if (file instanceof TFile) {
		return file.name.endsWith(plugin.settings.encryptedExtension);
	}
	if (file instanceof TFolder) {
		return file.children.some((child) => isEncryptedItem(plugin, child));
	}
	return false;
}

async function processItems(
	plugin: RCryptPlugin,
	items: TAbstractFile[],
	action: 'encrypt' | 'decrypt',
	useCustomPrompt: boolean
): Promise<void> {
	const t = getText();
	const title = action === 'encrypt' ? t.modalTitleEncrypt(items.length) : t.modalTitleDecrypt(items.length);

	if (useCustomPrompt || !plugin.settings.passphrase) {
		new PassphraseModal(
			plugin.app,
			title,
			plugin.settings.salt,
			async (res) => {
				const result = await executeBatchAction(plugin, items, action, res.passphrase, res.salt);
				return result.successCount > 0 && result.failCount === 0;
			}
		).open();
	} else {
		await executeBatchAction(
			plugin,
			items,
			action,
			plugin.settings.passphrase,
			plugin.settings.salt
		);
	}
}

async function executeBatchAction(
	plugin: RCryptPlugin,
	items: TAbstractFile[],
	action: 'encrypt' | 'decrypt',
	passphrase: string,
	salt: string
): Promise<{ successCount: number; failCount: number }> {
	const t = getText();
	let successCount = 0;
	let failCount = 0;

	const allFiles: TFile[] = [];
	const topFolders: TFolder[] = [];

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
				const isAlreadyEncrypted = isEncryptedFilename(file.name, plugin.settings.encryptedExtension, plugin.settings.filenameEncryptionMode);
				if (isAlreadyEncrypted) {
					continue;
				}
				const content = new Uint8Array(await plugin.app.vault.readBinary(file));
				const encryptedBytes = plugin.engine.encryptFile(content, passphrase, salt);

				const encName = plugin.engine.encryptName(file.name, passphrase, salt);
				const suffix = getEffectiveSuffix(plugin.settings.encryptedExtension, plugin.settings.filenameEncryptionMode);
				const targetPath = `${file.parent ? file.parent.path + '/' : ''}${encName}${suffix}`;

				await plugin.app.vault.createBinary(
					targetPath,
					toArrayBuffer(encryptedBytes)
				);

				if (plugin.settings.autoDeleteSource) {
					await plugin.app.fileManager.trashFile(file);
				}
				successCount++;
			} else {
				// Decrypt action
				const suffix = getEffectiveSuffix(plugin.settings.encryptedExtension, plugin.settings.filenameEncryptionMode);
				let rawEncName = file.name;

				if (suffix && file.name.endsWith(suffix)) {
					rawEncName = file.name.slice(0, -suffix.length);
				}

				let decName = rawEncName;

				// 1. Validate filename decryption FIRST if filename encryption is enabled
				if (plugin.settings.filenameEncryptionMode !== 'off') {
					try {
						decName = plugin.engine.decryptName(rawEncName, passphrase, salt);
					} catch {
						throw new Error(
							'Encoding mismatch or incorrect passphrase/salt.'
						);
					}
				}

				// 2. Decrypt file payload
				const content = new Uint8Array(await plugin.app.vault.readBinary(file));
				const decryptedBytes = plugin.engine.decryptFile(content, passphrase, salt);

				// 3. Save decrypted file
				const targetPath = `${file.parent ? file.parent.path + '/' : ''}${decName}`;
				await plugin.app.vault.createBinary(
					targetPath,
					toArrayBuffer(decryptedBytes)
				);

				// 4. Trash source encrypted file only after successful decryption & save
				if (plugin.settings.autoDeleteSource) {
					await plugin.app.fileManager.trashFile(file);
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

	// Rename target folder(s) if encryptFolderNames is enabled
	if (plugin.settings.encryptFolderNames && topFolders.length > 0) {
		for (const folder of topFolders) {
			try {
				if (action === 'encrypt') {
					const encFolderName = plugin.engine.encryptName(folder.name, passphrase, salt);
					const parentPath = folder.parent ? folder.parent.path : '';
					const targetFolderPath = parentPath && parentPath !== '/' ? `${parentPath}/${encFolderName}` : encFolderName;
					await plugin.app.fileManager.renameFile(folder, targetFolderPath);
				} else {
					let decFolderName = folder.name;
					try {
						decFolderName = plugin.engine.decryptName(folder.name, passphrase, salt);
					} catch {
						// Fallback if folder name was not encrypted
					}
					const parentPath = folder.parent ? folder.parent.path : '';
					const targetFolderPath = parentPath && parentPath !== '/' ? `${parentPath}/${decFolderName}` : decFolderName;
					await plugin.app.fileManager.renameFile(folder, targetFolderPath);
				}
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : 'Folder rename error';
				console.error(`Error renaming folder: ${msg}`);
			}
		}
	}

	if (successCount > 0 || failCount > 0) {
		if (failCount > 0 && successCount === 0) {
			new Notice(
				action === 'encrypt'
					? t.noticeEncryptFailed(failCount, firstErrorMessage)
					: t.noticeDecryptFailed(failCount, firstErrorMessage)
			);
		} else if (failCount > 0) {
			new Notice(
				t.noticeActionFinishedWithErrors(action, successCount, failCount, firstErrorMessage)
			);
		} else {
			new Notice(
				action === 'encrypt'
					? t.noticeEncryptSuccess(successCount)
					: t.noticeDecryptSuccess(successCount)
			);
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
	if (configuredSuffix && configuredSuffix.toLowerCase() === 'none') {
		return '';
	}
	if (mode !== 'off' && (!configuredSuffix || configuredSuffix === '.bin')) {
		return '';
	}
	return configuredSuffix || '.rcrypt';
}

function isEncryptedFilename(filename: string, configuredSuffix: string, mode: string): boolean {
	const suffix = getEffectiveSuffix(configuredSuffix, mode);
	if (suffix) {
		return filename.endsWith(suffix);
	}
	return false;
}
