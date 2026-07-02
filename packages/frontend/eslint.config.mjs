import preact from 'eslint-config-preact';
import tsParser from '@typescript-eslint/parser';

// eslint-config-preact@2.0.0 already ships a flat-config array
// (ESM `export default [...]` with `languageOptions`/`plugins` objects),
// so it is spread directly rather than wrapped in FlatCompat — FlatCompat
// is only for translating legacy eslintrc-style shareable configs, and
// feeding it an already-flat config would mangle it.
//
// The preact config parses with @babel/eslint-parser (JS/JSX only). This
// project's source is TypeScript (.ts/.tsx), so a later block re-points the
// parser to @typescript-eslint/parser for those files. All preact rules
// (@eslint/js recommended + eslint-plugin-react + react-hooks) still apply
// because the preact config block has no `files` restriction; only the
// parser is overridden here.
export default [
	...preact,
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				ecmaFeatures: { jsx: true },
			},
		},
	},
	{
		ignores: ['dist/**', 'node_modules/**'],
	},
];
