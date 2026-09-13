import { describe, expect, it } from 'vitest';
import { getText, localeMap, TranslationSchema } from '../src/i18n/i18n';

describe('i18n Full Language Coverage Test', () => {
	const supportedLanguages = ['en', 'zh', 'zh-cn', 'zh-tw', 'es', 'fr', 'de', 'ja', 'ko', 'ru', 'ar', 'he'];

	it('should have a locale map entry for all supported languages', () => {
		for (const lang of supportedLanguages) {
			expect(localeMap[lang], `Language "${lang}" should exist in localeMap`).toBeDefined();
		}
	});

	it('should verify that EVERY translation key in TranslationSchema is defined and non-empty for ALL supported languages', () => {
		const schemaKeys = Object.keys(localeMap.en) as (keyof TranslationSchema)[];

		for (const lang of supportedLanguages) {
			const localeObj = localeMap[lang];

			for (const key of schemaKeys) {
				const val = localeObj[key];
				expect(val, `Language "${lang}" missing key "${key}"`).toBeDefined();

				if (typeof val === 'string') {
					expect(val.trim().length, `Language "${lang}" key "${key}" should not be empty`).toBeGreaterThan(0);
				} else if (typeof val === 'function') {
					expect(typeof val, `Language "${lang}" key "${key}" should be a function`).toBe('function');
				}
			}
		}
	});

	it('should test parameterized translation functions for all languages', () => {
		for (const lang of supportedLanguages) {
			const l = localeMap[lang];
			expect(typeof l.encryptItems(3)).toBe('string');
			expect(typeof l.decryptItems(3)).toBe('string');
			expect(typeof l.modalTitleEncrypt(3)).toBe('string');
			expect(typeof l.modalTitleDecrypt(3)).toBe('string');
			expect(typeof l.noticeEncryptSuccess(3)).toBe('string');
			expect(typeof l.noticeDecryptSuccess(3)).toBe('string');
			expect(typeof l.noticeDecryptSuccessInnerLayer(3)).toBe('string');
			expect(typeof l.noticeEncryptFailed(3, 'error')).toBe('string');
			expect(typeof l.noticeDecryptFailed(3, 'error')).toBe('string');
			expect(typeof l.noticeActionFinishedWithErrors('encrypt', 1, 1, 'err')).toBe('string');
			expect(typeof l.confirmEncryptDesc?.(3, 'Test')).toBe('string');
			expect(typeof l.confirmEncryptCustomDesc?.(3)).toBe('string');
			expect(typeof l.progressTitle?.('🔒', 'Encrypting', 5)).toBe('string');
			expect(typeof l.progressStatus?.(2, 5, 40)).toBe('string');
			expect(typeof l.progressCurrentFile?.('test.txt')).toBe('string');
			expect(typeof l.noticeMappedFolderNotFound?.('folder')).toBe('string');
			expect(typeof l.noticeReencryptPrompt?.('file.txt')).toBe('string');
			expect(typeof l.noticeFileLocked?.('file.txt')).toBe('string');
			expect(typeof l.newProfileName?.(2)).toBe('string');
			expect(typeof l.passphraseHintLabel?.('hint')).toBe('string');
		}
	});
});
