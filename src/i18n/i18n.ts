import { getLanguage, moment } from 'obsidian';

export interface TranslationSchema {
	// Settings Tab
	settingsHeading: string;
	settingsHeadingDesc: string;
	defaultPassphraseName: string;
	defaultPassphraseDesc: string;
	defaultPassphrasePlaceholder: string;
	defaultSaltName: string;
	defaultSaltDesc: string;
	defaultSaltWarning: string;
	defaultSaltPlaceholder: string;
	filenameEncryptionModeName: string;
	filenameEncryptionModeDesc: string;
	modeStandard: string;
	modeObfuscate: string;
	modeOff: string;
	filenameEncodingName: string;
	filenameEncodingDesc: string;
	encodingBase32: string;
	encodingBase64: string;
	encryptedSuffixName: string;
	encryptedSuffixDesc: string;
	encryptFolderNamesName: string;
	encryptFolderNamesDesc: string;
	autoDeleteSourceName: string;
	autoDeleteSourceDesc: string;

	// Context Menu & Actions
	encryptFile: string;
	encryptFolder: string;
	encryptItems: (count: number) => string;
	encryptCustomPassphrase: string;
	decryptFile: string;
	decryptFolder: string;
	decryptItems: (count: number) => string;
	decryptCustomPassphrase: string;

	// Passphrase Modal
	modalTitleEncrypt: (count: number) => string;
	modalTitleDecrypt: (count: number) => string;
	modalPassphraseName: string;
	modalPassphraseDesc: string;
	modalPassphrasePlaceholder: string;
	modalSaltName: string;
	modalSaltDesc: string;
	modalConfirmBtn: string;
	modalErrPassphraseRequired: string;
	modalErrDecryptFailed: string;

	// Notices & Notifications
	noticeEncryptSuccess: (count: number) => string;
	noticeDecryptSuccess: (count: number) => string;
	noticeEncryptFailed: (count: number, err: string) => string;
	noticeDecryptFailed: (count: number, err: string) => string;
	noticeActionFinishedWithErrors: (action: string, success: number, fail: number, err: string) => string;
}

const en: TranslationSchema = {
	settingsHeading: 'Vault encryption',
	settingsHeadingDesc: '1:1 client-side encryption compatible with RCLONE Crypt. Files and folders encrypted here can be directly decrypted by RCLONE CLI and vice versa using matching passphrase, salt, and filename encryption settings.',
	defaultPassphraseName: 'Default passphrase',
	defaultPassphraseDesc: 'Master passphrase used for 1-click encryption/decryption.',
	defaultPassphrasePlaceholder: 'Enter master passphrase...',
	defaultSaltName: 'Default salt (password2)',
	defaultSaltDesc: 'Salt used alongside passphrase (corresponds to password2 in rclone.conf). Setting a custom salt is strongly recommended.',
	defaultSaltWarning: ' ⚠️ Using default salt ("rclone") is weaker against rainbow table attacks.',
	defaultSaltPlaceholder: 'rclone',
	filenameEncryptionModeName: 'Filename encryption mode',
	filenameEncryptionModeDesc: 'Mode matching crypt-filename-encryption in rclone.conf',
	modeStandard: 'Standard (AES-256 EME - Recommended)',
	modeObfuscate: 'Obfuscate (Light rotation)',
	modeOff: 'Off (Filenames left in plaintext)',
	filenameEncodingName: 'Filename encoding',
	filenameEncodingDesc: 'Text encoding matching filename_encoding in rclone.conf',
	encodingBase32: 'Base32 (Standard lowercase)',
	encodingBase64: 'Base64 (URL-safe, case-sensitive)',
	encryptedSuffixName: 'Encrypted file suffix',
	encryptedSuffixDesc: 'Extension appended when filename encryption is "Off" (corresponds to --crypt-suffix in rclone).',
	encryptFolderNamesName: 'Encrypt selected folders',
	encryptFolderNamesDesc: 'When right-clicking a folder, encrypt/rename the target folder itself in addition to its contents.',
	autoDeleteSourceName: 'Auto-delete source file',
	autoDeleteSourceDesc: 'Automatically delete unencrypted file after successful encryption.',

	encryptFile: 'Encrypt file',
	encryptFolder: 'Encrypt folder',
	encryptItems: (count: number) => `Encrypt ${count} items`,
	encryptCustomPassphrase: 'Encrypt with custom passphrase...',
	decryptFile: 'Decrypt file',
	decryptFolder: 'Decrypt folder',
	decryptItems: (count: number) => `Decrypt ${count} items`,
	decryptCustomPassphrase: 'Decrypt with custom passphrase...',

	modalTitleEncrypt: (count: number) => `Encrypt ${count} item(s)`,
	modalTitleDecrypt: (count: number) => `Decrypt ${count} item(s)`,
	modalPassphraseName: 'Passphrase',
	modalPassphraseDesc: 'Enter the encryption/decryption passphrase',
	modalPassphrasePlaceholder: 'Enter passphrase...',
	modalSaltName: 'Salt',
	modalSaltDesc: 'Salt / password2 (optional, defaults to settings or "rclone")',
	modalConfirmBtn: 'Confirm',
	modalErrPassphraseRequired: '⚠️ Please enter a passphrase.',
	modalErrDecryptFailed: '❌ Decryption failed. Incorrect passphrase or salt.',

	noticeEncryptSuccess: (count: number) => `✅ Encryption completed: ${count} item${count > 1 ? 's' : ''} processed.`,
	noticeDecryptSuccess: (count: number) => `✅ Decryption completed: ${count} item${count > 1 ? 's' : ''} processed.`,
	noticeEncryptFailed: (count: number, err: string) => `❌ Encryption failed (${count} item${count > 1 ? 's' : ''}): ${err}`,
	noticeDecryptFailed: (count: number, err: string) => `❌ Decryption failed (${count} item${count > 1 ? 's' : ''}): ${err}`,
	noticeActionFinishedWithErrors: (action: string, success: number, fail: number, err: string) => `⚠️ ${action === 'encrypt' ? 'Encryption' : 'Decryption'} finished with errors: ${success} succeeded, ${fail} failed. (${err})`,
};

const zh: TranslationSchema = {
	settingsHeading: '保管库加密',
	settingsHeadingDesc: '与 RCLONE Crypt 1:1 兼容的客户端加密。使用匹配的密码、盐和文件名加密设置，在此加密的文件和文件夹可以直接由 RCLONE CLI 解密，反之亦然。',
	defaultPassphraseName: '默认密码',
	defaultPassphraseDesc: '用于一键加密/解密的主密码。',
	defaultPassphrasePlaceholder: '输入主密码...',
	defaultSaltName: '默认盐 (password2)',
	defaultSaltDesc: '与密码一起使用的盐（对应于 rclone.conf 中的 password2）。强烈建议设置自定义盐。',
	defaultSaltWarning: ' ⚠️ 使用默认盐 ("rclone") 在面对彩虹表攻击时较弱。',
	defaultSaltPlaceholder: 'rclone',
	filenameEncryptionModeName: '文件名加密模式',
	filenameEncryptionModeDesc: '匹配 rclone.conf 中的 crypt-filename-encryption 模式',
	modeStandard: '标准 (AES-256 EME - 推荐)',
	modeObfuscate: '混淆 (轻量旋转)',
	modeOff: '关闭 (文件名保持明文)',
	filenameEncodingName: '文件名编码',
	filenameEncodingDesc: '匹配 rclone.conf 中的 filename_encoding 编码',
	encodingBase32: 'Base32 (标准小写)',
	encodingBase64: 'Base64 (URL 安全, 区分大小写)',
	encryptedSuffixName: '加密文件后缀',
	encryptedSuffixDesc: '当文件名加密为 "关闭" 时附加的扩展名（对应 rclone 中的 --crypt-suffix）。',
	encryptFolderNamesName: '加密选中的文件夹',
	encryptFolderNamesDesc: '右键单击文件夹时，除内容外，还加密/重命名目标文件夹本身。',
	autoDeleteSourceName: '自动删除源文件',
	autoDeleteSourceDesc: '加密成功后自动删除未加密的源文件。',

	encryptFile: '加密文件',
	encryptFolder: '加密文件夹',
	encryptItems: (count: number) => `加密 ${count} 个项目`,
	encryptCustomPassphrase: '使用自定义密码加密...',
	decryptFile: '解密文件',
	decryptFolder: '解密文件夹',
	decryptItems: (count: number) => `解密 ${count} 个项目`,
	decryptCustomPassphrase: '使用自定义密码解密...',

	modalTitleEncrypt: (count: number) => `加密 ${count} 个项目`,
	modalTitleDecrypt: (count: number) => `解密 ${count} 个项目`,
	modalPassphraseName: '密码',
	modalPassphraseDesc: '输入加密/解密密码',
	modalPassphrasePlaceholder: '输入密码...',
	modalSaltName: '盐',
	modalSaltDesc: '盐 / password2 (可选，默认为设置或 "rclone")',
	modalConfirmBtn: '确认',
	modalErrPassphraseRequired: '⚠️ 请输入密码。',
	modalErrDecryptFailed: '❌ 解密失败。密码或盐不正确。',

	noticeEncryptSuccess: (count: number) => `✅ 加密完成：已处理 ${count} 个项目。`,
	noticeDecryptSuccess: (count: number) => `✅ 解密完成：已处理 ${count} 个项目。`,
	noticeEncryptFailed: (count: number, err: string) => `❌ 加密失败 (${count} 个项目)：${err}`,
	noticeDecryptFailed: (count: number, err: string) => `❌ 解密失败 (${count} 个项目)：${err}`,
	noticeActionFinishedWithErrors: (action: string, success: number, fail: number, err: string) => `⚠️ ${action === 'encrypt' ? '加密' : '解密'} 完成但有错误：${success} 成功，${fail} 失败。(${err})`,
};

const zhTW: TranslationSchema = {
	settingsHeading: '寶庫加密',
	settingsHeadingDesc: '與 RCLONE Crypt 1:1 相容的用戶端加密。使用符合的密碼、鹽和檔名加密設定，在此加密的檔案和資料夾可以直接由 RCLONE CLI 解密，反之亦然。',
	defaultPassphraseName: '預設密碼',
	defaultPassphraseDesc: '用於一鍵加密/解密的主密碼。',
	defaultPassphrasePlaceholder: '輸入主密碼...',
	defaultSaltName: '預設鹽 (password2)',
	defaultSaltDesc: '與密碼一起使用的鹽（對應於 rclone.conf 中的 password2）。強烈建議設定自訂鹽。',
	defaultSaltWarning: ' ⚠️ 使用預設鹽 ("rclone") 在面對彩虹表攻擊時較弱。',
	defaultSaltPlaceholder: 'rclone',
	filenameEncryptionModeName: '檔名加密模式',
	filenameEncryptionModeDesc: '符合 rclone.conf 中的 crypt-filename-encryption 模式',
	modeStandard: '標準 (AES-256 EME - 推薦)',
	modeObfuscate: '混淆 (輕量旋轉)',
	modeOff: '關閉 (檔名保持明文)',
	filenameEncodingName: '檔名編碼',
	filenameEncodingDesc: '符合 rclone.conf 中的 filename_encoding 編碼',
	encodingBase32: 'Base32 (標準小寫)',
	encodingBase64: 'Base64 (URL 安全, 區分大小寫)',
	encryptedSuffixName: '加密檔案副檔名',
	encryptedSuffixDesc: '當檔名加密為 "關閉" 時附加的副檔名（對應 rclone 中的 --crypt-suffix）。',
	encryptFolderNamesName: '加密選取的資料夾',
	encryptFolderNamesDesc: '右鍵按一下資料夾時，除內容外，還加密/重新命名目標資料夾本身。',
	autoDeleteSourceName: '自動刪除來源檔案',
	autoDeleteSourceDesc: '加密成功後自動刪除未加密的來源檔案。',

	encryptFile: '加密檔案',
	encryptFolder: '加密資料夾',
	encryptItems: (count: number) => `加密 ${count} 個項目`,
	encryptCustomPassphrase: '使用自訂密碼加密...',
	decryptFile: '解密檔案',
	decryptFolder: '解密資料夾',
	decryptItems: (count: number) => `解密 ${count} 個項目`,
	decryptCustomPassphrase: '使用自訂密碼解密...',

	modalTitleEncrypt: (count: number) => `加密 ${count} 個項目`,
	modalTitleDecrypt: (count: number) => `解密 ${count} 個項目`,
	modalPassphraseName: '密碼',
	modalPassphraseDesc: '輸入加密/解密密碼',
	modalPassphrasePlaceholder: '輸入密碼...',
	modalSaltName: '鹽',
	modalSaltDesc: '鹽 / password2 (選填，預設為設定或 "rclone")',
	modalConfirmBtn: '確認',
	modalErrPassphraseRequired: '⚠️ 請輸入密碼。',
	modalErrDecryptFailed: '❌ 解密失敗。密碼或鹽不正確。',

	noticeEncryptSuccess: (count: number) => `✅ 加密完成：已處理 ${count} 個項目。`,
	noticeDecryptSuccess: (count: number) => `✅ 解密完成：已處理 ${count} 個項目。`,
	noticeEncryptFailed: (count: number, err: string) => `❌ 加密失敗 (${count} 個項目)：${err}`,
	noticeDecryptFailed: (count: number, err: string) => `❌ 解密失敗 (${count} 個項目)：${err}`,
	noticeActionFinishedWithErrors: (action: string, success: number, fail: number, err: string) => `⚠️ ${action === 'encrypt' ? '加密' : '解密'} 完成但有錯誤：${success} 成功，${fail} 失敗。(${err})`,
};

const es: TranslationSchema = {
	settingsHeading: 'Cifrado de la bóveda',
	settingsHeadingDesc: 'Cifrado del lado del cliente 1:1 compatible con RCLONE Crypt. Los archivos y carpetas cifrados aquí se pueden descifrar directamente con RCLONE CLI y viceversa.',
	defaultPassphraseName: 'Frase de contraseña predeterminada',
	defaultPassphraseDesc: 'Frase de contraseña maestra utilizada para cifrar/descifrar con 1 clic.',
	defaultPassphrasePlaceholder: 'Ingrese la frase de contraseña...',
	defaultSaltName: 'Sal predeterminada (password2)',
	defaultSaltDesc: 'Sal utilizada junto con la contraseña (corresponde a password2 en rclone.conf).',
	defaultSaltWarning: ' ⚠️ Usar la sal predeterminada ("rclone") es menos seguro.',
	defaultSaltPlaceholder: 'rclone',
	filenameEncryptionModeName: 'Modo de cifrado de nombres de archivo',
	filenameEncryptionModeDesc: 'Modo coincidente con crypt-filename-encryption en rclone.conf',
	modeStandard: 'Estándar (AES-256 EME - Recomendado)',
	modeObfuscate: 'Ofuscar (Rotación ligera)',
	modeOff: 'Desactivado (Nombres de archivo en texto plano)',
	filenameEncodingName: 'Codificación de nombres de archivo',
	filenameEncodingDesc: 'Codificación coincidente con filename_encoding en rclone.conf',
	encodingBase32: 'Base32 (Minusculas estándar)',
	encodingBase64: 'Base64 (Seguro para URL, sensible a mayúsculas)',
	encryptedSuffixName: 'Sufijo de archivo cifrado',
	encryptedSuffixDesc: 'Extensión agregada cuando el cifrado de nombres está desactivado.',
	encryptFolderNamesName: 'Cifrar carpetas seleccionadas',
	encryptFolderNamesDesc: 'Al hacer clic derecho en una carpeta, cifra/renombra la propia carpeta.',
	autoDeleteSourceName: 'Eliminar automáticamente archivo origen',
	autoDeleteSourceDesc: 'Elimina automáticamente el archivo sin cifrar tras un cifrado exitoso.',

	encryptFile: 'Cifrar archivo',
	encryptFolder: 'Cifrar carpeta',
	encryptItems: (count: number) => `Cifrar ${count} elementos`,
	encryptCustomPassphrase: 'Cifrar con frase de contraseña personalizada...',
	decryptFile: 'Descifrar archivo',
	decryptFolder: 'Descifrar carpeta',
	decryptItems: (count: number) => `Descifrar ${count} elementos`,
	decryptCustomPassphrase: 'Descifrar con frase de contraseña personalizada...',

	modalTitleEncrypt: (count: number) => `Cifrar ${count} elemento(s)`,
	modalTitleDecrypt: (count: number) => `Descifrar ${count} elemento(s)`,
	modalPassphraseName: 'Frase de contraseña',
	modalPassphraseDesc: 'Ingrese la frase de contraseña de cifrado/descifrado',
	modalPassphrasePlaceholder: 'Ingrese frase de contraseña...',
	modalSaltName: 'Sal',
	modalSaltDesc: 'Sal / password2 (opcional)',
	modalConfirmBtn: 'Confirmar',
	modalErrPassphraseRequired: '⚠️ Por favor ingrese una frase de contraseña.',
	modalErrDecryptFailed: '❌ Error de descifrado. Frase de contraseña o sal incorrecta.',

	noticeEncryptSuccess: (count: number) => `✅ Cifrado completado: ${count} elemento(s) procesado(s).`,
	noticeDecryptSuccess: (count: number) => `✅ Descifrado completado: ${count} elemento(s) procesado(s).`,
	noticeEncryptFailed: (count: number, err: string) => `❌ Cifrado fallido (${count} elementos): ${err}`,
	noticeDecryptFailed: (count: number, err: string) => `❌ Descifrado fallido (${count} elementos): ${err}`,
	noticeActionFinishedWithErrors: (action: string, success: number, fail: number, err: string) => `⚠️ ${action === 'encrypt' ? 'Cifrado' : 'Descifrado'} finalizado con errores: ${success} con éxito, ${fail} fallidos. (${err})`,
};

const fr: TranslationSchema = {
	settingsHeading: 'Chiffrement du coffre',
	settingsHeadingDesc: 'Chiffrement côté client 1:1 compatible avec RCLONE Crypt. Les fichiers et dossiers chiffrés ici peuvent être directement déchiffrés par RCLONE CLI et vice-versa.',
	defaultPassphraseName: 'Mot de passe par défaut',
	defaultPassphraseDesc: 'Mot de passe principal utilisé pour le chiffrement/déchiffrement en 1 clic.',
	defaultPassphrasePlaceholder: 'Saisir le mot de passe principal...',
	defaultSaltName: 'Sel par défaut (password2)',
	defaultSaltDesc: 'Sel utilisé avec le mot de passe (correspond à password2 dans rclone.conf).',
	defaultSaltWarning: ' ⚠️ L’utilisation du sel par défaut ("rclone") est moins sécurisée.',
	defaultSaltPlaceholder: 'rclone',
	filenameEncryptionModeName: 'Mode de chiffrement des noms de fichier',
	filenameEncryptionModeDesc: 'Mode correspondant à crypt-filename-encryption dans rclone.conf',
	modeStandard: 'Standard (AES-256 EME - Recommandé)',
	modeObfuscate: 'Offusquer (Rotation légère)',
	modeOff: 'Désactivé (Noms de fichier en texte clair)',
	filenameEncodingName: 'Encodage des noms de fichier',
	filenameEncodingDesc: 'Encodage correspondant à filename_encoding dans rclone.conf',
	encodingBase32: 'Base32 (Minuscules standard)',
	encodingBase64: 'Base64 (Sécurisé pour URL, sensible à la casse)',
	encryptedSuffixName: 'Suffixe de fichier chiffré',
	encryptedSuffixDesc: 'Extension ajoutée lorsque le chiffrement des noms est désactivé.',
	encryptFolderNamesName: 'Chiffrer les dossiers sélectionnés',
	encryptFolderNamesDesc: 'Lors d’un clic droit sur un dossier, chiffre/renomme le dossier cible lui-même.',
	autoDeleteSourceName: 'Supprimer automatiquement le fichier source',
	autoDeleteSourceDesc: 'Supprime automatiquement le fichier non chiffré après un chiffrement réussi.',

	encryptFile: 'Chiffrer le fichier',
	encryptFolder: 'Chiffrer le dossier',
	encryptItems: (count: number) => `Chiffrer ${count} éléments`,
	encryptCustomPassphrase: 'Chiffrer avec un mot de passe personnalisé...',
	decryptFile: 'Déchiffrer le fichier',
	decryptFolder: 'Déchiffrer le dossier',
	decryptItems: (count: number) => `Déchiffrer ${count} éléments`,
	decryptCustomPassphrase: 'Déchiffrer avec un mot de passe personnalisé...',

	modalTitleEncrypt: (count: number) => `Chiffrer ${count} élément(s)`,
	modalTitleDecrypt: (count: number) => `Déchiffrer ${count} élément(s)`,
	modalPassphraseName: 'Mot de passe',
	modalPassphraseDesc: 'Saisir le mot de passe de chiffrement/déchiffrement',
	modalPassphrasePlaceholder: 'Saisir le mot de passe...',
	modalSaltName: 'Sel',
	modalSaltDesc: 'Sel / password2 (facultatif)',
	modalConfirmBtn: 'Confirmer',
	modalErrPassphraseRequired: '⚠️ Veuillez saisir un mot de passe.',
	modalErrDecryptFailed: '❌ Échec du déchiffrement. Mot de passe ou sel incorrect.',

	noticeEncryptSuccess: (count: number) => `✅ Chiffrement terminé : ${count} élément(s) traité(s).`,
	noticeDecryptSuccess: (count: number) => `✅ Déchiffrement terminé : ${count} élément(s) traité(s).`,
	noticeEncryptFailed: (count: number, err: string) => `❌ Échec du chiffrement (${count} éléments) : ${err}`,
	noticeDecryptFailed: (count: number, err: string) => `❌ Échec du déchiffrement (${count} éléments) : ${err}`,
	noticeActionFinishedWithErrors: (action: string, success: number, fail: number, err: string) => `⚠️ ${action === 'encrypt' ? 'Chiffrement' : 'Déchiffrement'} terminé avec des erreurs : ${success} réussi(s), ${fail} échoué(s). (${err})`,
};

const de: TranslationSchema = {
	settingsHeading: 'Tresor-Verschlüsselung',
	settingsHeadingDesc: '1:1 clientseitige Verschlüsselung kompatibel mit RCLONE Crypt. Hier verschlüsselte Dateien und Ordner können direkt von der RCLONE CLI entschlüsselt werden und umgekehrt.',
	defaultPassphraseName: 'Standard-Passphrase',
	defaultPassphraseDesc: 'Master-Passphrase für 1-Klick-Verschlüsselung/Entschlüsselung.',
	defaultPassphrasePlaceholder: 'Master-Passphrase eingeben...',
	defaultSaltName: 'Standard-Salt (password2)',
	defaultSaltDesc: 'Salt zusammen mit der Passphrase (entspricht password2 in rclone.conf).',
	defaultSaltWarning: ' ⚠️ Die Verwendung des Standard-Salts ("rclone") ist schwächer.',
	defaultSaltPlaceholder: 'rclone',
	filenameEncryptionModeName: 'Dateinamen-Verschlüsselungsmodus',
	filenameEncryptionModeDesc: 'Modus entsprechend crypt-filename-encryption in rclone.conf',
	modeStandard: 'Standard (AES-256 EME - Empfohlen)',
	modeObfuscate: 'Obfuskieren (Leichte Rotation)',
	modeOff: 'Aus (Dateinamen bleiben Klartext)',
	filenameEncodingName: 'Dateinamen-Kodierung',
	filenameEncodingDesc: 'Kodierung entsprechend filename_encoding in rclone.conf',
	encodingBase32: 'Base32 (Standard-Kleinbuchstaben)',
	encodingBase64: 'Base64 (URL-sicher, Groß-/Kleinschreibung)',
	encryptedSuffixName: 'Verschlüsseltes Dateisuffix',
	encryptedSuffixDesc: 'Endung, die angehängt wird, wenn Dateinamen-Verschlüsselung "Aus" ist.',
	encryptFolderNamesName: 'Ausgewählte Ordner verschlüsseln',
	encryptFolderNamesDesc: 'Beim Rechtsklick auf einen Ordner wird auch der Zielordner selbst verschlüsselt/umbenannt.',
	autoDeleteSourceName: 'Quelldatei automatisch löschen',
	autoDeleteSourceDesc: 'Löscht die unverschlüsselte Quelldatei nach erfolgreicher Verschlüsselung automatisch.',

	encryptFile: 'Datei verschlüsseln',
	encryptFolder: 'Ordner verschlüsseln',
	encryptItems: (count: number) => `${count} Elemente verschlüsseln`,
	encryptCustomPassphrase: 'Mit benutzerdefinierter Passphrase verschlüsseln...',
	decryptFile: 'Datei entschlüsseln',
	decryptFolder: 'Ordner entschlüsseln',
	decryptItems: (count: number) => `${count} Elemente entschlüsseln`,
	decryptCustomPassphrase: 'Mit benutzerdefinierter Passphrase entschlüsseln...',

	modalTitleEncrypt: (count: number) => `${count} Element(e) verschlüsseln`,
	modalTitleDecrypt: (count: number) => `${count} Element(e) entschlüsseln`,
	modalPassphraseName: 'Passphrase',
	modalPassphraseDesc: 'Verschlüsselungs-/Entschlüsselungs-Passphrase eingeben',
	modalPassphrasePlaceholder: 'Passphrase eingeben...',
	modalSaltName: 'Salt',
	modalSaltDesc: 'Salt / password2 (optional)',
	modalConfirmBtn: 'Bestätigen',
	modalErrPassphraseRequired: '⚠️ Bitte geben Sie eine Passphrase ein.',
	modalErrDecryptFailed: '❌ Entschlüsselung fehlgeschlagen. Falsche Passphrase oder Salt.',

	noticeEncryptSuccess: (count: number) => `✅ Verschlüsselung abgeschlossen: ${count} Element(e) verarbeitet.`,
	noticeDecryptSuccess: (count: number) => `✅ Entschlüsselung abgeschlossen: ${count} Element(e) verarbeitet.`,
	noticeEncryptFailed: (count: number, err: string) => `❌ Verschlüsselung fehlgeschlagen (${count} Elemente): ${err}`,
	noticeDecryptFailed: (count: number, err: string) => `❌ Entschlüsselung fehlgeschlagen (${count} Elemente): ${err}`,
	noticeActionFinishedWithErrors: (action: string, success: number, fail: number, err: string) => `⚠️ ${action === 'encrypt' ? 'Verschlüsselung' : 'Entschlüsselung'} mit Fehlern beendet: ${success} erfolgreich, ${fail} fehlgeschlagen. (${err})`,
};

const ja: TranslationSchema = {
	settingsHeading: '保管庫の暗号化',
	settingsHeadingDesc: 'RCLONE Cryptと1:1互換のクライアント側暗号化。ここで暗号化されたファイルやフォルダは、RCLONE CLIで直接復号でき、その逆も可能です。',
	defaultPassphraseName: 'デフォルトのパスフレーズ',
	defaultPassphraseDesc: 'ワンクリックで暗号化/復号に使用するマスターパスフレーズ。',
	defaultPassphrasePlaceholder: 'マスターパスフレーズを入力...',
	defaultSaltName: 'デフォルトのソルト (password2)',
	defaultSaltDesc: 'パスフレーズと共に使用されるソルト (rclone.conf の password2 に相当)。',
	defaultSaltWarning: ' ⚠️ デフォルトのソルト ("rclone") の使用は安全性が低くなります。',
	defaultSaltPlaceholder: 'rclone',
	filenameEncryptionModeName: 'ファイル名暗号化モード',
	filenameEncryptionModeDesc: 'rclone.conf の crypt-filename-encryption に相当するモード',
	modeStandard: '標準 (AES-256 EME - 推奨)',
	modeObfuscate: '難読化 (軽量ローテーション)',
	modeOff: 'オフ (ファイル名は平文のまま)',
	filenameEncodingName: 'ファイル名エンコーディング',
	filenameEncodingDesc: 'rclone.conf の filename_encoding に相当するエンコーディング',
	encodingBase32: 'Base32 (標準小文字)',
	encodingBase64: 'Base64 (URLセーフ、大文字小文字を区別)',
	encryptedSuffixName: '暗号化ファイルのサフィックス',
	encryptedSuffixDesc: 'ファイル名暗号化が「オフ」の時に追加される拡張子。',
	encryptFolderNamesName: '選択したフォルダを暗号化',
	encryptFolderNamesDesc: 'フォルダを右クリックした際、内容に加えてターゲットフォルダ自体も暗号化/名前変更します。',
	autoDeleteSourceName: '元ファイルを自動削除',
	autoDeleteSourceDesc: '暗号化が成功した後、未暗号化の元ファイルを自動的に削除します。',

	encryptFile: 'ファイルを暗号化',
	encryptFolder: 'フォルダを暗号化',
	encryptItems: (count: number) => `${count}件のアイテムを暗号化`,
	encryptCustomPassphrase: 'カスタムパスフレーズで暗号化...',
	decryptFile: 'ファイルを復号',
	decryptFolder: 'フォルダを復号',
	decryptItems: (count: number) => `${count}件のアイテムを復号`,
	decryptCustomPassphrase: 'カスタムパスフレーズで復号...',

	modalTitleEncrypt: (count: number) => `${count}件のアイテムを暗号化`,
	modalTitleDecrypt: (count: number) => `${count}件のアイテムを復号`,
	modalPassphraseName: 'パスフレーズ',
	modalPassphraseDesc: '暗号化/復号のパスフレーズを入力',
	modalPassphrasePlaceholder: 'パスフレーズを入力...',
	modalSaltName: 'ソルト',
	modalSaltDesc: 'ソルト / password2 (任意)',
	modalConfirmBtn: '確認',
	modalErrPassphraseRequired: '⚠️ パスフレーズを入力してください。',
	modalErrDecryptFailed: '❌ 復号に失敗しました。パスフレーズまたはソルトが正しくありません。',

	noticeEncryptSuccess: (count: number) => `✅ 暗号化完了: ${count}件のアイテムを処理しました。`,
	noticeDecryptSuccess: (count: number) => `✅ 復号完了: ${count}件のアイテムを処理しました。`,
	noticeEncryptFailed: (count: number, err: string) => `❌ 暗号化失敗 (${count}件): ${err}`,
	noticeDecryptFailed: (count: number, err: string) => `❌ 復号失敗 (${count}件): ${err}`,
	noticeActionFinishedWithErrors: (action: string, success: number, fail: number, err: string) => `⚠️ ${action === 'encrypt' ? '暗号化' : '復号'} がエラー付きで完了しました: ${success}件成功、${fail}件失敗。(${err})`,
};

const ko: TranslationSchema = {
	settingsHeading: '보관함 암호화',
	settingsHeadingDesc: 'RCLONE Crypt와 1:1 호환되는 클라이언트 측 암호화입니다. 여기서 암호화된 파일과 폴더는 RCLONE CLI에서 직접 복호화할 수 있으며 그 반대도 가능합니다.',
	defaultPassphraseName: '기본 암호문',
	defaultPassphraseDesc: '1클릭 암호화/복호화에 사용되는 마스터 암호문입니다.',
	defaultPassphrasePlaceholder: '마스터 암호문 입력...',
	defaultSaltName: '기본 솔트 (password2)',
	defaultSaltDesc: '암호문과 함께 사용되는 솔트입니다 (rclone.conf의 password2에 해당).',
	defaultSaltWarning: ' ⚠️ 기본 솔트 ("rclone") 사용은 보안에 취약합니다.',
	defaultSaltPlaceholder: 'rclone',
	filenameEncryptionModeName: '파일명 암호화 모드',
	filenameEncryptionModeDesc: 'rclone.conf의 crypt-filename-encryption에 해당하는 모드',
	modeStandard: '표준 (AES-256 EME - 권장)',
	modeObfuscate: '혼동 (가벼운 회전)',
	modeOff: '끄기 (파일명은 평문으로 유지)',
	filenameEncodingName: '파일명 인코딩',
	filenameEncodingDesc: 'rclone.conf의 filename_encoding에 해당하는 인코딩',
	encodingBase32: 'Base32 (표준 소문자)',
	encodingBase64: 'Base64 (URL 안전, 대소문자 구분)',
	encryptedSuffixName: '암호화된 파일 접미사',
	encryptedSuffixDesc: '파일명 암호화가 "끄기"일 때 추가되는 확장자입니다.',
	encryptFolderNamesName: '선택한 폴더 암호화',
	encryptFolderNamesDesc: '폴더 우클릭 시 내용 외에 대상 폴더 자체도 암호화/이름 변경합니다.',
	autoDeleteSourceName: '원본 파일 자동 삭제',
	autoDeleteSourceDesc: '암호화 성공 후 암호화되지 않은 원본 파일을 자동으로 삭제합니다.',

	encryptFile: '파일 암호화',
	encryptFolder: '폴더 암호화',
	encryptItems: (count: number) => `항목 ${count}개 암호화`,
	encryptCustomPassphrase: '사용자 지정 암호문으로 암호화...',
	decryptFile: '파일 복호화',
	decryptFolder: '폴더 복호화',
	decryptItems: (count: number) => `항목 ${count}개 복호화`,
	decryptCustomPassphrase: '사용자 지정 암호문으로 복호화...',

	modalTitleEncrypt: (count: number) => `항목 ${count}개 암호화`,
	modalTitleDecrypt: (count: number) => `항목 ${count}개 복호화`,
	modalPassphraseName: '암호문',
	modalPassphraseDesc: '암호화/복호화 암호문 입력',
	modalPassphrasePlaceholder: '암호문 입력...',
	modalSaltName: '솔트',
	modalSaltDesc: '솔트 / password2 (선택 사항)',
	modalConfirmBtn: '확인',
	modalErrPassphraseRequired: '⚠️ 암호문을 입력하십시오.',
	modalErrDecryptFailed: '❌ 복호화 실패. 올바르지 않은 암호문 또는 솔트입니다.',

	noticeEncryptSuccess: (count: number) => `✅ 암호화 완료: ${count}개 항목 처리됨.`,
	noticeDecryptSuccess: (count: number) => `✅ 복호화 완료: ${count}개 항목 처리됨.`,
	noticeEncryptFailed: (count: number, err: string) => `❌ 암호화 실패 (${count}개 항목): ${err}`,
	noticeDecryptFailed: (count: number, err: string) => `❌ 복호화 실패 (${count}개 항목): ${err}`,
	noticeActionFinishedWithErrors: (action: string, success: number, fail: number, err: string) => `⚠️ ${action === 'encrypt' ? '암호화' : '복호화'}가 오류와 함께 완료됨: ${success}개 성공, ${fail}개 실패. (${err})`,
};

const ru: TranslationSchema = {
	settingsHeading: 'Шифрование хранилища',
	settingsHeadingDesc: 'Клиентское шифрование 1:1, совместимое с RCLONE Crypt. Файлы и папки, зашифрованные здесь, могут быть расшифрованы через RCLONE CLI и наоборот.',
	defaultPassphraseName: 'Парольная фраза по умолчанию',
	defaultPassphraseDesc: 'Мастер-пароль для шифрования/расшифровки в 1 клик.',
	defaultPassphrasePlaceholder: 'Введите мастер-пароль...',
	defaultSaltName: 'Соль по умолчанию (password2)',
	defaultSaltDesc: 'Соль, используемая вместе с паролем (соответствует password2 в rclone.conf).',
	defaultSaltWarning: ' ⚠️ Использование соли по умолчанию ("rclone") менее безопасно.',
	defaultSaltPlaceholder: 'rclone',
	filenameEncryptionModeName: 'Режим шифрования имен файлов',
	filenameEncryptionModeDesc: 'Режим, соответствующий crypt-filename-encryption в rclone.conf',
	modeStandard: 'Стандартный (AES-256 EME - Рекомендуется)',
	modeObfuscate: 'Маскирование (Легкое вращение)',
	modeOff: 'Отключено (Имена файлов в открытом виде)',
	filenameEncodingName: 'Кодировка имен файлов',
	filenameEncodingDesc: 'Кодировка, соответствующая filename_encoding в rclone.conf',
	encodingBase32: 'Base32 (Стандартный нижний регистр)',
	encodingBase64: 'Base64 (URL-безопасный, с учетом регистра)',
	encryptedSuffixName: 'Суффикс зашифрованного файла',
	encryptedSuffixDesc: 'Расширение, добавляемое при отключенном шифровании имен файлов.',
	encryptFolderNamesName: 'Шифровать выбранные папки',
	encryptFolderNamesDesc: 'При клике правой кнопкой на папку шифрует/переименовывает саму папку.',
	autoDeleteSourceName: 'Автоматически удалять исходный файл',
	autoDeleteSourceDesc: 'Автоматически удаляет незашифрованный исходный файл после успешного шифрования.',

	encryptFile: 'Зашифровать файл',
	encryptFolder: 'Зашифровать папку',
	encryptItems: (count: number) => `Зашифровать ${count} элементов`,
	encryptCustomPassphrase: 'Зашифровать с пользовательским паролем...',
	decryptFile: 'Расшифровать файл',
	decryptFolder: 'Расшифровать папку',
	decryptItems: (count: number) => `Расшифровать ${count} элементов`,
	decryptCustomPassphrase: 'Расшифровать с пользовательским паролем...',

	modalTitleEncrypt: (count: number) => `Зашифровать ${count} элемент(ов)`,
	modalTitleDecrypt: (count: number) => `Расшифровать ${count} элемент(ов)`,
	modalPassphraseName: 'Парольная фраза',
	modalPassphraseDesc: 'Введите парольную фразу шифрования/расшифровки',
	modalPassphrasePlaceholder: 'Введите пароль...',
	modalSaltName: 'Соль',
	modalSaltDesc: 'Соль / password2 (необязательно)',
	modalConfirmBtn: 'Подтвердить',
	modalErrPassphraseRequired: '⚠️ Пожалуйста, введите парольную фразу.',
	modalErrDecryptFailed: '❌ Ошибка расшифровки. Неверный пароль или соль.',

	noticeEncryptSuccess: (count: number) => `✅ Шифрование завершено: обработано ${count} элемент(ов).`,
	noticeDecryptSuccess: (count: number) => `✅ Расшифровка завершена: обработано ${count} элемент(ов).`,
	noticeEncryptFailed: (count: number, err: string) => `❌ Ошибка шифрования (${count} элементов): ${err}`,
	noticeDecryptFailed: (count: number, err: string) => `❌ Ошибка расшифровки (${count} элементов): ${err}`,
	noticeActionFinishedWithErrors: (action: string, success: number, fail: number, err: string) => `⚠️ ${action === 'encrypt' ? 'Шифрование' : 'Расшифровка'} завершена с ошибками: ${success} успешно, ${fail} не удалось. (${err})`,
};

const ar: TranslationSchema = {
	settingsHeading: 'تشفير الخزنة',
	settingsHeadingDesc: 'تشفير 1:1 من جانب العميل متوافق مع RCLONE Crypt. يمكن فك تشفير الملفات والمجلدات المشفرة هنا مباشرة بواسطة RCLONE CLI والعكس صحيح.',
	defaultPassphraseName: 'عبارة المرور الافتراضية',
	defaultPassphraseDesc: 'عبارة المرور الرئيسية المستخدمة للتشفير/فك التشفير بنقرة واحدة.',
	defaultPassphrasePlaceholder: 'أدخل عبارة المرور الرئيسية...',
	defaultSaltName: 'الملح الافتراضي (password2)',
	defaultSaltDesc: 'الملح المستخدم جنبًا إلى جنب مع عبارة المرور (يطابق password2 في rclone.conf).',
	defaultSaltWarning: ' ⚠️ استخدام الملح الافتراضي ("rclone") أضعف ضد هجمات جدول التشفير.',
	defaultSaltPlaceholder: 'rclone',
	filenameEncryptionModeName: 'وضع تشفير أسماء الملفات',
	filenameEncryptionModeDesc: 'وضع يطابق crypt-filename-encryption في rclone.conf',
	modeStandard: 'قياسي (AES-256 EME - موصى به)',
	modeObfuscate: 'تشويه (تدوير خفيف)',
	modeOff: 'إيقاف (ترك أسماء الملفات كنص عادي)',
	filenameEncodingName: 'ترميز أسماء الملفات',
	filenameEncodingDesc: 'ترميز النص المطابق لـ filename_encoding في rclone.conf',
	encodingBase32: 'Base32 (أحرف صغيرة قياسية)',
	encodingBase64: 'Base64 (آمن لـ URL، حساس لحالة الأحرف)',
	encryptedSuffixName: 'لاحقة الملف المشفر',
	encryptedSuffixDesc: 'الملحق المضاف عندما يكون تشفير أسماء الملفات "مغلق".',
	encryptFolderNamesName: 'تشفير المجلدات المحددة',
	encryptFolderNamesDesc: 'عند النقر بزر الفأرة الأيمن على مجلد، قم بتشفير/إعادة تسمية المجلد نفسه بالإضافة إلى محتوياته.',
	autoDeleteSourceName: 'حذف الملف المصدر تلقائيًا',
	autoDeleteSourceDesc: 'حذف الملف غير المشفر تلقائيًا بعد التشفير الناجح.',

	encryptFile: 'تشفير الملف',
	encryptFolder: 'تشفير المجلد',
	encryptItems: (count: number) => `تشفير ${count} عناصر`,
	encryptCustomPassphrase: 'التشفير بعبارة مرور مخصصة...',
	decryptFile: 'فك تشفير الملف',
	decryptFolder: 'فك تشفير المجلد',
	decryptItems: (count: number) => `فك تشفير ${count} عناصر`,
	decryptCustomPassphrase: 'فك التشفير بعبارة مرور مخصصة...',

	modalTitleEncrypt: (count: number) => `تشفير ${count} عنصر/عناصر`,
	modalTitleDecrypt: (count: number) => `فك تشفير ${count} عنصر/عناصر`,
	modalPassphraseName: 'عبارة المرور',
	modalPassphraseDesc: 'أدخل عبارة مرور التشفير/فك التشفير',
	modalPassphrasePlaceholder: 'أدخل عبارة المرور...',
	modalSaltName: 'الملح',
	modalSaltDesc: 'الملح / password2 (اختياري)',
	modalConfirmBtn: 'تأكيد',
	modalErrPassphraseRequired: '⚠️ يرجى إدخال عبارة المرور.',
	modalErrDecryptFailed: '❌ فشل فك التشفير. عبارة المرور أو الملح غير صحيح.',

	noticeEncryptSuccess: (count: number) => `✅ اكتمل التشفير: تم معالجة ${count} عنصر/عناصر.`,
	noticeDecryptSuccess: (count: number) => `✅ اكتمل فك التشفير: تم معالجة ${count} عنصر/عناصر.`,
	noticeEncryptFailed: (count: number, err: string) => `❌ فشل التشفير (${count} عناصر): ${err}`,
	noticeDecryptFailed: (count: number, err: string) => `❌ فشل فك التشفير (${count} عناصر): ${err}`,
	noticeActionFinishedWithErrors: (action: string, success: number, fail: number, err: string) => `⚠️ اكتمل ${action === 'encrypt' ? 'التشفير' : 'فك التشفير'} مع وجود أخطاء: نجح ${success}، وفشل ${fail}. (${err})`,
};

const he: TranslationSchema = {
	settingsHeading: 'הצפנת כספת',
	settingsHeadingDesc: 'הצפנת צד-לקוח 1:1 התואמת ל-RCLONE Crypt. קבצים ותיקיות המוצפנים כאן ניתנים לפענוח ישירות על ידי RCLONE CLI ולהיפך.',
	defaultPassphraseName: 'סיסמת ברירת מחדל',
	defaultPassphraseDesc: 'סיסמת מאסטר המשמשת להצפנה/פענוח בלחיצה אחת.',
	defaultPassphrasePlaceholder: 'הזן סיסמת מאסטר...',
	defaultSaltName: 'Salt ברירת מחדל (password2)',
	defaultSaltDesc: 'Salt המשמש לצד הסיסמה (תואם ל-password2 ב-rclone.conf).',
	defaultSaltWarning: ' ⚠️ שימוש ב-Salt ברירת מחדל ("rclone") חלש יותר.',
	defaultSaltPlaceholder: 'rclone',
	filenameEncryptionModeName: 'מצב הצפנת שמות קבצים',
	filenameEncryptionModeDesc: 'מצב התואם ל-crypt-filename-encryption ב-rclone.conf',
	modeStandard: 'רגיל (AES-256 EME - מומלץ)',
	modeObfuscate: 'ערפול (סיבוב קל)',
	modeOff: 'כבוי (שמות קבצים נשארים בטקסט גלוי)',
	filenameEncodingName: 'קידוד שמות קבצים',
	filenameEncodingDesc: 'קידוד טקסט התואם ל-filename_encoding ב-rclone.conf',
	encodingBase32: 'Base32 (אותיות קטנות רגילות)',
	encodingBase64: 'Base64 (בטוח ל-URL, רגיש לאותיות גדולות/קטנות)',
	encryptedSuffixName: 'סיומת קובץ מוצפן',
	encryptedSuffixDesc: 'סיומת שמתווספת כאשר הצפנת שמות קבצים היא "כבויה".',
	encryptFolderNamesName: 'הצפנת תיקיות שנבחרו',
	encryptFolderNamesDesc: 'בלחיצה ימנית על תיקייה, מצפין/משנה את שם התיקייה עצמה בנוסף לתוכנה.',
	autoDeleteSourceName: 'מחיקת קובץ מקור אוטומטית',
	autoDeleteSourceDesc: 'מוחק אוטומטית את קובץ המקור הבלתי מוצפן לאחר הצפנה מוצלחת.',

	encryptFile: 'הצפן קובץ',
	encryptFolder: 'הצפן תיקייה',
	encryptItems: (count: number) => `הצפן ${count} פריטים`,
	encryptCustomPassphrase: 'הצפן עם סיסמה מותאמת אישית...',
	decryptFile: 'פענח קובץ',
	decryptFolder: 'פענח תיקייה',
	decryptItems: (count: number) => `פענח ${count} פריטים`,
	decryptCustomPassphrase: 'פענח עם סיסמה מותאמת אישית...',

	modalTitleEncrypt: (count: number) => `הצפן ${count} פריטים`,
	modalTitleDecrypt: (count: number) => `פענח ${count} פריטים`,
	modalPassphraseName: 'סיסמה',
	modalPassphraseDesc: 'הזן סיסמת הצפנה/פענוח',
	modalPassphrasePlaceholder: 'הזן סיסמה...',
	modalSaltName: 'Salt',
	modalSaltDesc: 'Salt / password2 (אופציונלי)',
	modalConfirmBtn: 'אישור',
	modalErrPassphraseRequired: '⚠️ אנא הזן סיסמה.',
	modalErrDecryptFailed: '❌ הפענוח נכשל. סיסמה או Salt שגויים.',

	noticeEncryptSuccess: (count: number) => `✅ ההצפנה הושלמה: עובדו ${count} פריטים.`,
	noticeDecryptSuccess: (count: number) => `✅ הפענוח הושלם: עובדו ${count} פריטים.`,
	noticeEncryptFailed: (count: number, err: string) => `❌ ההצפנה נכשלה (${count} פריטים): ${err}`,
	noticeDecryptFailed: (count: number, err: string) => `❌ הפענוח נכשל (${count} פריטים): ${err}`,
	noticeActionFinishedWithErrors: (action: string, success: number, fail: number, err: string) => `⚠️ ${action === 'encrypt' ? 'ההצפנה' : 'הפענוח'} הושלמו עם שגיאות: ${success} הצליחו, ${fail} נכשלו. (${err})`,
};

const localeMap: Record<string, TranslationSchema> = {
	en,
	'zh-cn': zh,
	zh,
	'zh-tw': zhTW,
	es,
	fr,
	de,
	ja,
	ko,
	ru,
	ar,
	he,
};

export function getText(): TranslationSchema {
	const lang = getLanguage() || moment.locale() || 'en';
	const normalizedLang = lang.toLowerCase();
	return localeMap[normalizedLang] || localeMap[normalizedLang.split('-')[0]] || en;
}
