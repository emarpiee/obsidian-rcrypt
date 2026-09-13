import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'jsdom',
		globals: true,
		alias: {
			obsidian: './tests/mocks/obsidian.ts',
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/**/*.ts'],
			exclude: ['src/main.ts', 'src/types/**', 'src/**/*.d.ts'],
		},
	},
});
