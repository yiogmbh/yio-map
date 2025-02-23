import gitignore from 'eslint-config-flat-gitignore';
import eslintConfigPrettier from 'eslint-config-prettier';
import html from 'eslint-plugin-html';

export default [
  gitignore(),
  {
    files: ['**/*.html'],
    plugins: { html },
  },
  eslintConfigPrettier,
];
