import { defineConfig } from '@playwright/test'
import nextEnv from '@next/env'
nextEnv.loadEnvConfig(process.cwd())
export default defineConfig({
  testDir: './tests/browser', workers: 1, timeout: 60000,
  use: { baseURL: process.env.TEST_URL || 'http://localhost:3000', launchOptions: { args: ['--enable-unsafe-swiftshader'] }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  reporter: 'list',
})
