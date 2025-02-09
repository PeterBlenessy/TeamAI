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