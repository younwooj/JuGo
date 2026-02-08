/**
 * Default platform implementation (native).
 * Metro/Expo bundler resolves:
 * - web build → platform.web.ts
 * - native build → platform.native.ts
 */
export { platform } from './platform.native';
