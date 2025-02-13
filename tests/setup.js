import { beforeAll } from 'vitest';
import { Quasar } from 'quasar';
import { config } from '@vue/test-utils';

// Setup Vue Test Utils to use Quasar
config.global.plugins = [Quasar];

// Mock TextEncoder/TextDecoder for Node.js environment
if (typeof TextEncoder === 'undefined') {
    global.TextEncoder = class {
        encode(str) {
            return Buffer.from(str);
        }
    };
}

if (typeof TextDecoder === 'undefined') {
    global.TextDecoder = class {
        decode(arr) {
            return Buffer.from(arr).toString();
        }
    };
}

// Mock requestAnimationFrame
if (typeof requestAnimationFrame === 'undefined') {
    global.requestAnimationFrame = callback => setTimeout(callback, 0);
}

// Mock logger to avoid window dependency in tests
vi.mock('@/services/logger', () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

// Mock Tauri APIs
vi.mock('@tauri-apps/api/path', () => ({
    join: (...parts) => parts.join('/'),
    dirname: (path) => path.split('/').slice(0, -1).join('/')
}));

vi.mock('@tauri-apps/api/os', () => ({
    platform: () => Promise.resolve('darwin'),
    homeDir: () => Promise.resolve('/Users/test')
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
    readDir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    remove: vi.fn()
}));