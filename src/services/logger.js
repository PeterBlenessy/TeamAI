import { trace, debug, info, warn, error } from "@tauri-apps/plugin-log";
import { useSettingsStore } from '@/stores/settings-store';

const logLevels = {
    'trace': 0,
    'debug': 1,
    'info': 2,
    'warn': 3,
    'error': 4
};

    // ---------------------------------------------------------------------------------------------
    // Print 'message' based on selected log level.
    //
    // Uses regular console.log/info/warn/debug/error to print logs to the webview console.
    // Uses tauri-plugin-log-api to print logs to application stdout/stderr
    // and to write logs to the OS specific logs directory.
    // Ref: https://github.com/tauri-apps/tauri-plugin-log/blob/v1/src/lib.rs
    //
    // ### Platform-specific
    //
    // |Platform | Value                                         | Example                                        |
    // | ------- | --------------------------------------------- | ---------------------------------------------- |
    // | Linux   | `{configDir}/{bundleIdentifier}`              | `/home/alice/.config/com.tauri.dev`            |
    // | macOS   | `{homeDir}/Library/Logs/{bundleIdentifier}`   | `/Users/Alice/Library/Logs/com.tauri.dev`      |
    // | Windows | `{configDir}/{bundleIdentifier}`              | `C:\Users\Alice\AppData\Roaming\com.tauri.dev` |
    //
    // Log levels in increasing order of severity:
    //  - trace  - very low priority, extremely verbouse information
    //  - debug  - lower priority information
    //  - info   - useful information
    //  - warn   - hazardous situations
    //  - error  - serious errors
    // ---------------------------------------------------------------------------------------------
// Initialize store statically to avoid Pinia initialization issues
let store = null;
const getStore = () => {
    if (!store) {
        try {
            store = useSettingsStore();
        } catch (error) {
            // Default values if store isn't available
            return {
                loggingEnabled: true,
                logLevel: 'info'
            };
        }
    }
    return store;
};

const shouldLog = (level) => {
    const settings = getStore();
    if (!settings.loggingEnabled) return false;
    return logLevels[level] >= logLevels[settings.logLevel];
};

const logger = {
    info: (message) => {
        if (shouldLog('info')) {
            info(message.toString());
            console.info(message.toString());
        }
    },
    debug: (message) => {
        if (shouldLog('debug')) {
            debug(message.toString());
            console.debug(message.toString());
        }
    },
    error: (message) => {
        if (shouldLog('error')) {
            error(message.toString());
            console.error(message.toString());
        }
    },
    log: (message) => {
        if (shouldLog('info')) {
            info(message.toString());
            console.log(message.toString());
        }
    },
    trace: (message) => {
        if (shouldLog('trace')) {
            trace(message.toString());
            console.trace(message.toString());
        }
    },
    warn: (message) => {
        if (shouldLog('warn')) {
            warn(message.toString());
            console.warn(message.toString());
        }
    }
};

export default logger;
