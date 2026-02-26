import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import tanstackPlugin from "@tanstack/eslint-plugin-query";

export default defineConfig([
	globalIgnores(['dist']),
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			reactHooks.configs.flat.recommended,
			reactRefresh.configs.vite,
		],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
		plugins: [prettierPlugin, tanstackPlugin],
		rules: {
			'prettier/prettier': ['error', {}, { usePrettierrc: true }],
			...prettierConfig.rules,
		},
	},
]);
