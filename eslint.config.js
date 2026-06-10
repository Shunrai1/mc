import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    'node_modules',
    'node_modules/**',
    '.md',
    '.pnp',
    '.pnp/**',
    '.pnp.js',
    '**/.pnp.js/**',
    'coverage',
    'coverage/**',
    'test-results/',
    'test-results/**/',
    'playwright-report/',
    'playwright-report/**/',
    'playwright/.cache/',
    'playwright/.cache/**/',
    'dist',
    'dist/**',
    'high-level-dependencies.html',
    '**/high-level-dependencies.html/**',
    '.DS_Store',
    '**/.DS_Store/**',
    '*.pem',
    '**/*.pem/**',
    'npm-debug.log*',
    '**/npm-debug.log*/**',
    'yarn-debug.log*',
    '**/yarn-debug.log*/**',
    'yarn-error.log*',
    '**/yarn-error.log*/**',
    '.pnpm-debug.log*',
    '**/.pnpm-debug.log*/**',
    '.env*.local',
    '**/.env*.local/**',
    '.vercel',
    '**/.vercel/**',
    '**/.sisyphus/**',
    '**/*.agent/**',
    '**/*.cursor/**',
    '**/docs/**',
    '**/*.md/**',
  ],
  rules: {
    // 允许使用 console.debug (用于调试功能)
    'no-console': ['error', { allow: ['warn', 'error', 'debug'] }],
    // 允许单行 if 语句
    'antfu/if-newline': 'off',
    // 允许 } catch/else 等连写
    'antfu/brace-style': 'off',
    'style/brace-style': 'off',
    // 允许箭头函数单参数不加括号
    'style/arrow-parens': 'off',
    // 允许小写十六进制颜色字面量 (0xffffff)
    'unicorn/number-literal-case': 'off',
    // 允许换行符
    'operator-linebreak': 'none',
  },
})
