// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            // The plugin reaches into Day.js's private instance fields (`this.$y`,
            // `this.$L`, `this.$locale()`) which aren't exposed in its public
            // typings, so a controlled amount of `any` is required here.
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
        },
    },
    // Must be last: turns off any ESLint/typescript-eslint stylistic rules
    // that would otherwise conflict with Prettier's formatting.
    eslintConfigPrettier
);