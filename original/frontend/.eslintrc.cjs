module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: ['eslint:recommended', '@typescript-eslint/recommended', 'plugin:svelte/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    extraFileExtensions: ['.svelte'],
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
  },
  settings: {
    'svelte/typescript': true,
    'svelte/ignore-styles': attributes => {
      return attributes.type === 'text/scss' || attributes.type === 'text/sass';
    },
  },
};
