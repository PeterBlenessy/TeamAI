import { vi } from 'vitest';

/**
 * Creates a mock cloud storage provider for testing
 */
export function createMockProvider() {
    return {
        getContainerPath: vi.fn().mockReturnValue('/mock/container'),
        writeFile: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn(),
        listFiles: vi.fn().mockResolvedValue([]), // Return empty array by default
        deleteFile: vi.fn().mockResolvedValue(undefined),
        isAvailable: vi.fn().mockReturnValue(true)
    };
}

/**
 * Creates common test data
 */
export const testData = {
    personas: {
        valid: {
            id: 'test-persona',
            name: 'Test Persona',
            prompt: 'Test prompt',
            readonly: false
        }
    },
    conversations: {
        valid: {
            history: {
                id: 'test-conversation',
                title: 'Test Conversation'
            },
            messages: [
                { id: '1', content: 'Test message' }
            ]
        }
    }
};