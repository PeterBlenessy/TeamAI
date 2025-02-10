import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHandler } from '@/composables/cloud-sync/create-handler';
import { ValidationError } from '@/services/cloud-storage/types';

// Mock logger
vi.mock('@/services/logger', () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

describe('Sync Handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('requires a type', () => {
        expect(() => createHandler()).toThrow(ValidationError);
        expect(() => createHandler({})).toThrow(ValidationError);
        expect(() => createHandler({ type: 'test' })).not.toThrow();
    });

    describe('Data Transformation', () => {
        it('transforms data with validation', async () => {
            const handler = createHandler({
                type: 'test',
                transform: data => ({ ...data, processed: true })
            });

            const result = await handler.transform({ id: '1', value: 'test' });
            expect(result).toEqual({
                id: '1',
                value: 'test',
                processed: true
            });
        });

        it('handles transform failures', async () => {
            const handler = createHandler({
                type: 'test',
                transform: () => null
            });

            await expect(handler.transform({ test: true }))
                .rejects.toThrow('Transform resulted in empty data');
        });
    });

    describe('Data Validation', () => {
        it('validates data structure', async () => {
            const handler = createHandler({
                type: 'test',
                validate: data => data.id && data.value
            });

            await expect(handler.validate({ id: '1', value: 'test' }))
                .resolves.toBe(true);

            await expect(handler.validate({ id: '1' }))
                .rejects.toThrow(ValidationError);
        });

        it('rejects null data', async () => {
            const handler = createHandler({ type: 'test' });
            await expect(handler.validate(null))
                .rejects.toThrow('Data is required');
        });
    });

    describe('Change Detection', () => {
        it('detects changes using timestamps', async () => {
            const local = { lastModified: new Date(2024, 0, 2).toISOString() };
            const remote = { lastModified: new Date(2024, 0, 1).toISOString() };
            const handler = createHandler({ type: 'test' });

            const result = await handler.detectChanges(local, remote);
            expect(result.hasChanges).toBe(true);
            expect(result.direction).toBe('upload');
        });

        it('detects changes using vector clocks', async () => {
            const local = { vectorClock: { counter: 2 } };
            const remote = { vectorClock: { counter: 1 } };
            const handler = createHandler({ type: 'test' });

            const result = await handler.detectChanges(local, remote);
            expect(result.hasChanges).toBe(true);
            expect(result.direction).toBe('upload');
        });

        it('falls back to custom comparison', async () => {
            const handler = createHandler({ 
                type: 'test',
                compareItems: () => true  // Mock difference found
            });

            const result = await handler.detectChanges({ data: '1' }, { data: '2' });
            expect(result.hasChanges).toBe(true);
            expect(result.direction).toBe('upload');
        });
    });

    describe('Batch Processing', () => {
        it('processes items in configured batch size', async () => {
            const handler = createHandler({
                type: 'test',
                batchSize: 2
            });

            const items = ['1', '2', '3', '4', '5'];
            const processor = vi.fn();
            
            await handler.processBatch(items, processor);
            
            // Should be called in 3 batches: [1,2], [3,4], [5]
            expect(processor).toHaveBeenCalledTimes(5);
        });
    });

    describe('Retry Mechanism', () => {
        it('retries failed operations with backoff', async () => {
            const handler = createHandler({
                type: 'test',
                retryAttempts: 2
            });

            const operation = vi.fn()
                .mockRejectedValueOnce(new Error('First attempt failed'))
                .mockResolvedValueOnce('success');

            const result = await handler.retry(operation, 'test operation');
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(2);
        });

        it('respects max retry attempts', async () => {
            const handler = createHandler({
                type: 'test',
                retryAttempts: 2
            });

            const operation = vi.fn().mockRejectedValue(new Error('Always fails'));

            await expect(handler.retry(operation, 'test operation'))
                .rejects.toThrow('Always fails');
            expect(operation).toHaveBeenCalledTimes(2);
        });
    });

    describe('Change Collection', () => {
        it('detects new local items', async () => {
            const handler = createHandler({ type: 'test' });
            const { changes } = await handler.getChanges(
                [{ id: 1, data: 'local' }],
                []
            );
            expect(changes).toHaveLength(1);
            expect(changes[0].type).toBe('upload');
            expect(changes[0].reason).toBe('new');
        });

        it('detects modified items', async () => {
            const handler = createHandler({ type: 'test' });
            const localItem = { 
                id: 1, 
                data: 'local',
                lastModified: new Date(2024, 0, 2).toISOString()
            };
            const remoteItem = {
                id: 1,
                data: 'remote',
                lastModified: new Date(2024, 0, 1).toISOString()
            };

            const { changes } = await handler.getChanges([localItem], [remoteItem]);
            expect(changes).toHaveLength(1);
            expect(changes[0].type).toBe('upload');
            expect(changes[0].reason).toBe('modified');
        });

        it('detects new remote items', async () => {
            const handler = createHandler({ type: 'test' });
            const { changes } = await handler.getChanges(
                [],
                [{ id: 1, data: 'remote' }]
            );
            expect(changes).toHaveLength(1);
            expect(changes[0].type).toBe('download');
            expect(changes[0].reason).toBe('new');
        });
    });
});