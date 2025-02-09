import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createICloudProvider } from '@/services/cloud-storage/icloud';
import { CloudError } from '@/services/cloud-storage/types';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/path', () => ({
    join: (...parts) => parts.join('/'),
    dirname: (path) => path.split('/').slice(0, -1).join('/')
}));

vi.mock('@tauri-apps/api/os', () => ({
    platform: vi.fn(),
    homeDir: vi.fn()
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
    readDir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    remove: vi.fn()
}));

vi.mock('@/services/logger', () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

describe('iCloud Provider', () => {
    const mockData = new Uint8Array([1, 2, 3, 4]);
    let provider;

    beforeEach(() => {
        vi.clearAllMocks();
        provider = createICloudProvider();
    });

    describe('Initialization', () => {
        it('should initialize on macOS', async () => {
            const platform = await import('@tauri-apps/api/os');
            const fs = await import('@tauri-apps/plugin-fs');
            
            platform.platform.mockResolvedValue('macos');
            platform.homeDir.mockResolvedValue('/Users/test');
            fs.mkdir.mockResolvedValue(undefined);
            fs.readDir.mockResolvedValue([]);

            await provider.init();
            expect(provider.isAvailable()).toBe(true);
            expect(fs.mkdir).toHaveBeenCalledTimes(4); // Main + 3 subdirs
        });

        it('should not initialize on other platforms', async () => {
            const platform = await import('@tauri-apps/api/os');
            platform.platform.mockResolvedValue('windows');

            await provider.init();
            expect(provider.isAvailable()).toBe(false);
        });
    });

    describe('File Operations', () => {
        beforeEach(async () => {
            const platform = await import('@tauri-apps/api/os');
            platform.platform.mockResolvedValue('macos');
            platform.homeDir.mockResolvedValue('/Users/test');
            await provider.init();
        });

        it('should write and verify file', async () => {
            const fs = await import('@tauri-apps/plugin-fs');
            fs.writeFile.mockResolvedValue(undefined);
            fs.readFile.mockResolvedValue(mockData);

            await provider.writeFile('test.txt', mockData);
            expect(fs.writeFile).toHaveBeenCalledWith('test.txt', mockData);
        });

        it('should handle write verification failure', async () => {
            const fs = await import('@tauri-apps/plugin-fs');
            fs.writeFile.mockResolvedValue(undefined);
            fs.readFile.mockResolvedValue(new Uint8Array([1])); // Different data

            await expect(
                provider.writeFile('test.txt', mockData)
            ).rejects.toThrow(CloudError);
        });

        it('should read file contents', async () => {
            const fs = await import('@tauri-apps/plugin-fs');
            fs.readFile.mockResolvedValue(mockData);

            const result = await provider.readFile('test.txt');
            expect(result).toEqual(mockData);
        });

        it('should list directory contents', async () => {
            const fs = await import('@tauri-apps/plugin-fs');
            const mockFiles = [
                { name: 'file1.txt', path: 'dir/file1.txt' },
                { name: 'file2.txt', path: 'dir/file2.txt' }
            ];
            fs.readDir.mockResolvedValue(mockFiles);

            const result = await provider.listFiles('dir');
            expect(result).toEqual(mockFiles);
        });

        it('should return empty array for non-existent directory', async () => {
            const fs = await import('@tauri-apps/plugin-fs');
            fs.readDir.mockRejectedValue(new Error('No such file'));

            const result = await provider.listFiles('non-existent');
            expect(result).toEqual([]);
        });
    });

    describe('Change Detection', () => {
        const mockFile = {
            name: 'test.txt',
            path: 'test.txt',
            modifiedAt: new Date().toISOString(),
            size: 100,
            isDirectory: false
        };

        beforeEach(async () => {
            const platform = await import('@tauri-apps/api/os');
            const fs = await import('@tauri-apps/plugin-fs');
            
            platform.platform.mockResolvedValue('macos');
            platform.homeDir.mockResolvedValue('/Users/test');
            fs.readDir.mockResolvedValue([mockFile]);
            
            await provider.init();
        });

        it('should detect changes since timestamp', async () => {
            const changes = await provider.listChanges(new Date(0));
            expect(changes.length).toBeGreaterThan(0);
            expect(changes[0]).toHaveProperty('path');
            expect(changes[0]).toHaveProperty('type');
            expect(changes[0]).toHaveProperty('timestamp');
        });

        it('should get file metadata', async () => {
            const metadata = await provider.getMetadata('test.txt');
            expect(metadata).toHaveProperty('modified');
            expect(metadata).toHaveProperty('size');
            expect(metadata).toHaveProperty('type');
            expect(metadata.type).toBe('file');
        });
    });

    describe('Error Handling', () => {
        it('should wrap filesystem errors', async () => {
            const fs = await import('@tauri-apps/plugin-fs');
            fs.readFile.mockRejectedValue(new Error('FS Error'));

            await expect(
                provider.readFile('test.txt')
            ).rejects.toThrow(CloudError);
        });

        it('should handle initialization errors', async () => {
            const platform = await import('@tauri-apps/api/os');
            const fs = await import('@tauri-apps/plugin-fs');
            
            platform.platform.mockResolvedValue('macos');
            fs.mkdir.mockRejectedValue(new Error('Permission denied'));

            await expect(provider.init()).rejects.toThrow(CloudError);
            expect(provider.isAvailable()).toBe(false);
        });
    });

    describe('Retry Mechanism', () => {
        it('should retry failed operations', async () => {
            const fs = await import('@tauri-apps/plugin-fs');
            fs.readFile
                .mockRejectedValueOnce(new Error('Temporary error'))
                .mockResolvedValueOnce(mockData);

            const result = await provider.retry(
                () => provider.readFile('test.txt'),
                'read test file'
            );
            
            expect(result).toEqual(mockData);
            expect(fs.readFile).toHaveBeenCalledTimes(2);
        });

        it('should fail after max retries', async () => {
            const fs = await import('@tauri-apps/plugin-fs');
            fs.readFile.mockRejectedValue(new Error('Persistent error'));

            await expect(
                provider.retry(
                    () => provider.readFile('test.txt'),
                    'read test file'
                )
            ).rejects.toThrow();
            
            expect(fs.readFile).toHaveBeenCalledTimes(3); // Default max attempts
        });
    });
});