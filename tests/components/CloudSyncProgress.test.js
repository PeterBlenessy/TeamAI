import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { Quasar, Dialog } from 'quasar';
import CloudSyncProgress from '@/components/CloudSyncProgress.vue';
import { SyncPhase } from '@/composables/cloudSync/sync-constants';

// Mock translations
vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    })
}));

// Mock cloud sync composable
let mockProgress = { phase: SyncPhase.IDLE, current: null };
let mockSyncing = false;

vi.mock('@/composables/useCloudSync', () => ({
    useCloudSync: () => ({
        progress: { value: mockProgress },
        syncing: { value: mockSyncing }
    }),
    SyncPhase: {
        IDLE: 'idle',
        STARTING: 'starting',
        CHECKING: 'checking',
        UPLOADING: 'uploading',
        DOWNLOADING: 'downloading',
        CLEANING: 'cleaning',
        COMPLETED: 'completed',
        ERROR: 'error'
    }
}));

describe('CloudSyncProgress', () => {
    let wrapper;

    const findInDialog = (selector) => {
        // Quasar teleports dialogs to the body
        return document.querySelector(selector);
    };

    const mountComponent = () => {
        wrapper = mount(CloudSyncProgress, {
            global: {
                plugins: [
                    [Quasar, {
                        plugins: {
                            Dialog
                        },
                        config: {
                            brand: {
                                primary: '#1976d2',
                                secondary: '#26a69a'
                            }
                        }
                    }],
                    createTestingPinia({
                        createSpy: vi.fn
                    })
                ],
                stubs: {
                    'q-dialog': false,
                    'q-card': false,
                    'q-card-section': false,
                    'q-card-actions': false,
                    'q-btn': false
                }
            },
            attachTo: document.body
        });
    };

    beforeEach(() => {
        // Reset mocks
        mockProgress = { phase: SyncPhase.IDLE, current: null };
        mockSyncing = false;
        // Mount component
        mountComponent();
    });

    afterEach(() => {
        wrapper.unmount();
        document.body.innerHTML = '';
    });

    it('shows progress card when syncing', async () => {
        mockSyncing = true;
        mountComponent();
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.cloud-sync-status').exists()).toBe(true);
        expect(wrapper.find('.q-linear-progress').exists()).toBe(true);
    });

    it('updates progress display based on phase', async () => {
        mockSyncing = true;
        const phases = [
            { phase: SyncPhase.CHECKING, expected: 'cloud.sync.phase.checking' },
            { phase: SyncPhase.UPLOADING, expected: 'cloud.sync.phase.uploading' },
            { phase: SyncPhase.DOWNLOADING, expected: 'cloud.sync.phase.downloading' },
            { phase: SyncPhase.COMPLETED, expected: 'cloud.sync.phase.completed' },
            { phase: SyncPhase.ERROR, expected: 'cloud.sync.phase.failed' }
        ];

        for (const { phase, expected } of phases) {
            mockProgress = { phase, current: null };
            mountComponent();
            await wrapper.vm.$nextTick();
            expect(wrapper.text()).toContain(expected);
        }
    });

    it('shows item progress when available', async () => {
        mockSyncing = true;
        mockProgress = {
            phase: SyncPhase.UPLOADING,
            current: {
                type: 'personas',
                count: 2,
                total: 4
            }
        };
        mountComponent();
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toContain('personas');
        expect(wrapper.text()).toContain('2/4');
    });

    it('handles conflict resolution', async () => {
        const conflict = {
            type: 'readonly',
            local: { id: '1', name: 'Local Item' },
            remote: { id: '1', name: 'Remote Item' }
        };

        // Show dialog and wait for it to render
        await wrapper.vm.showConflict(conflict);
        await wrapper.vm.$nextTick();
        
        // Set resolution
        wrapper.vm.selectedResolution = 'keep-remote';
        await wrapper.vm.$nextTick();

        // Find and click resolve button in teleported dialog
        const resolveBtn = findInDialog('[data-test="resolve-btn"]');
        expect(resolveBtn).toBeTruthy();
        await resolveBtn.click();
        
        // Verify emitted event
        expect(wrapper.emitted('resolveConflict')).toBeTruthy();
        expect(wrapper.emitted('resolveConflict')[0][0]).toEqual({
            type: 'readonly',
            resolution: 'keep-remote',
            local: conflict.local,
            remote: conflict.remote
        });
    });

    it('handles conflict cancellation', async () => {
        const conflict = {
            type: 'readonly',
            local: { id: '1', name: 'Local Item' },
            remote: { id: '1', name: 'Remote Item' }
        };

        // Show dialog and wait for it to render
        await wrapper.vm.showConflict(conflict);
        await wrapper.vm.$nextTick();
        
        // Find and click cancel button in teleported dialog
        const cancelBtn = findInDialog('[data-test="cancel-btn"]');
        expect(cancelBtn).toBeTruthy();
        await cancelBtn.click();
        
        // Verify emitted event
        expect(wrapper.emitted('cancelConflict')).toBeTruthy();
        expect(wrapper.emitted('cancelConflict')[0][0]).toEqual(conflict);
    });

    it('updates progress color and classes', async () => {
        mockSyncing = true;
        const states = [
            { phase: SyncPhase.ERROR, expected: 'negative' },
            { phase: SyncPhase.COMPLETED, expected: 'positive' },
            { phase: SyncPhase.UPLOADING, expected: 'primary' }
        ];

        for (const { phase, expected } of states) {
            mockProgress = { phase, current: null };
            mountComponent();
            await wrapper.vm.$nextTick();

            const progressBar = wrapper.find('.q-linear-progress');
            const classes = progressBar.attributes('class') || '';
            expect(classes).toContain(`bg-${expected}`);
        }
    });
});