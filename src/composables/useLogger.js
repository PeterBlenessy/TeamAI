import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { appLogDir } from '@tauri-apps/api/path';
import { getName } from '@tauri-apps/api/app';
import { useSettingsStore } from '@/stores/settings-store';
import { watch } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import logger from '@/services/logger';

export function useLogger() {
  const settingsStore = useSettingsStore();
  
  async function getLogPath() {
    const logDir = await appLogDir();
    const appName = await getName();
    return `${logDir}/${appName}.log`;
  }
  
  async function readLogs() {
    try {
      const logPath = await getLogPath();
      return await readTextFile(logPath);
    } catch (error) {
      console.error('Failed to read logs:', error);
      return '';
    }
  }

  async function clearLogs() {
    try {
      const logPath = await getLogPath();
      await writeTextFile(logPath, '');
      return true;
    } catch (error) {
      console.error('Failed to clear logs:', error);
      return false;
    }
  }

  // Log initial level
  const logInitialLevel = (level) => {
    switch (level) {
      case 'trace':
        logger.trace('Initial log level: TRACE - most verbose level, showing all log messages');
        break;
      case 'debug':
        logger.debug('Initial log level: DEBUG - showing debug and higher priority messages');
        break;
      case 'info':
        logger.info('Initial log level: INFO - showing info and higher priority messages');
        break;
      case 'warn':
        logger.warn('Initial log level: WARN - showing warn and error messages only');
        break;
      case 'error':
        logger.error('Initial log level: ERROR - showing only error messages');
        break;
    }
  };

  // Log level change
  const logLevelChange = (level) => {
    switch (level) {
      case 'trace':
        logger.trace('Log level changed to TRACE - most verbose level, showing all log messages');
        break;
      case 'debug':
        logger.debug('Log level changed to DEBUG - showing debug and higher priority messages');
        break;
      case 'info':
        logger.info('Log level changed to INFO - showing info and higher priority messages');
        break;
      case 'warn':
        logger.warn('Log level changed to WARN - showing warn and error messages only');
        break;
      case 'error':
        logger.error('Log level changed to ERROR - showing only error messages');
        break;
    }
  };

  // Set up log level sync with backend
  invoke('set_log_level', { level: settingsStore.logLevel }).catch(console.error);
  logInitialLevel(settingsStore.logLevel);

  // Watch for log level changes
  watch(() => settingsStore.logLevel, (newLevel) => {
    invoke('set_log_level', { level: newLevel }).catch(console.error);
    logLevelChange(newLevel);
  });

  return {
    readLogs,
    clearLogs
  };
}
