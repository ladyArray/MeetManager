require('@rushstack/eslint-config/patch/modern-module-resolution');

module.exports = {
  extends: ['@microsoft/eslint-config-spfx/lib/profiles/react'],
  parserOptions: { tsconfigRootDir: __dirname },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      rules: {
        '@rushstack/no-new-null': 1,
        '@rushstack/hoist-jest-mock': 1,
        '@rushstack/import-requires-chunk-name': 1,
        '@rushstack/pair-react-dom-render-unmount': 1,
        '@rushstack/security/no-unsafe-regexp': 1,
        '@typescript-eslint/explicit-function-return-type': [
          1,
          {
            allowExpressions: true,
            allowTypedFunctionExpressions: true
          }
        ],
        '@typescript-eslint/no-explicit-any': 2,
        '@typescript-eslint/no-floating-promises': 2,
        '@typescript-eslint/no-unused-vars': [
          1,
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
          }
        ],
        '@microsoft/spfx/no-require-ensure': 2,
        'max-lines': ['warn', { max: 1200 }]
      }
    },
    {
      files: [
        '*.test.ts',
        '*.test.tsx',
        '*.spec.ts',
        '*.spec.tsx',
        '**/__mocks__/*.ts',
        '**/__mocks__/*.tsx',
        '**/__tests__/*.ts',
        '**/__tests__/*.tsx',
        '**/test/*.ts',
        '**/test/*.tsx'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 0
      }
    }
  ]
};
