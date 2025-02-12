import { trace, debug, info, warn, error } from "@tauri-apps/plugin-log";
import { useSettingsStore } from '@/stores/settings-store';

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

// Level priorities (lower number = higher priority)
const logLevels = {
    'trace': 0,
    'debug': 1,
    'info': 2,
    'warn': 3,
    'error': 4
};

// Initialize store and set up log level sync with backend
let store = null;
const initStore = () => {
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

// Check if message should be logged based on current level
const shouldLog = (level) => {
    const settings = initStore();
    if (!settings.loggingEnabled) return false;
    return logLevels[level] >= logLevels[settings.logLevel];
};

function formatArg(arg) {
    if (typeof arg === 'object' && arg !== null) {
        try {
            return JSON.stringify(arg);
        } catch {
            return '[object]';
        }
    }
    return String(arg);
}

const logger = {
    info: (...args) => {
        if (shouldLog('info')) {
            info(args.map(formatArg).join(' '));
            console.info(...args);
        }
    },
    debug: (...args) => {
        if (shouldLog('debug')) {
            debug(args.map(formatArg).join(' '));
            console.debug(...args);
        }
    },
    error: (...args) => {
        if (shouldLog('error')) {
            error(args.map(formatArg).join(' '));
            console.error(...args);
        }
    },
    log: (...args) => {
        if (shouldLog('info')) {
            info(args.map(formatArg).join(' '));
            console.log(...args);
        }
    },
    trace: (...args) => {
        if (shouldLog('trace')) {
            trace(args.map(formatArg).join(' '));
            console.trace(...args);
        }
    },
    warn: (...args) => {
        if (shouldLog('warn')) {
            warn(args.map(formatArg).join(' '));
            console.warn(...args);
        }
    }
};

export default logger;
