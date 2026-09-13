import { describe, expect, it } from 'vitest';
import { getText, TranslationSchema } from '../src/i18n/i18n';

describe('i18n Translation Coverage', () => {
	it('should return non-empty strings or functions for all schema keys in default language', () => {
		const text = getText();
		const keys = Object.keys(text) as (keyof TranslationSchema)[];

		expect(keys.length).toBeGreaterThan(30);

		for (const key of keys) {
			const val = text[key];
			expect(val, `Key "${key}" should be defined`).toBeDefined();
			if (typeof val === 'string') {
				expect(val.length, `Key "${key}" string length should be > 0`).toBeGreaterThan(0);
			} else if (typeof val === 'function') {
				expect(typeof val, `Key "${key}" should be a function`).toBe('function');
			}
		}
	});

	it('should format parameterized translation functions correctly', () => {
		const text = getText();
		expect(text.encryptItems(5)).toContain('5');
		expect(text.decryptItems(3)).toContain('3');
		expect(text.modalTitleEncrypt(2)).toContain('2');
		expect(text.modalTitleDecrypt(4)).toContain('4');
		expect(text.noticeEncryptSuccess(10)).toContain('10');
		expect(text.noticeDecryptSuccess(7)).toContain('7');
	});
});
