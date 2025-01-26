import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { appLogDir } from '@tauri-apps/api/path';
import { getName } from '@tauri-apps/api/app';
import { useSettingsStore } from '@/stores/settings-store';

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

  return {
    readLogs,
    clearLogs
  };
}
