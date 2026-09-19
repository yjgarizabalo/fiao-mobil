// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import/no-named-as-default-member': 'off',
    },
  },
  {
    ignores: ['dist/*', 'android/*', 'ios/*', '.expo/*'],
  },
]);

