use log::LevelFilter;
use tauri_plugin_log::{Builder as LogBuilder, Target, TargetKind};

/// Convert string log level to LevelFilter
fn parse_log_level(level: &str) -> Result<LevelFilter, String> {
    match level.to_lowercase().as_str() {
        "trace" => Ok(LevelFilter::Trace),
        "debug" => Ok(LevelFilter::Debug),
        "info" => Ok(LevelFilter::Info),
        "warn" => Ok(LevelFilter::Warn),
        "error" => Ok(LevelFilter::Error),
        _ => Err("Invalid log level".to_string()),
    }
}

/// Command to dynamically change the log level
#[tauri::command]
async fn set_log_level(level: String) -> Result<(), String> {
    let level_filter = parse_log_level(&level)?;
    log::set_max_level(level_filter);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_level = LevelFilter::Info;

    // Create and configure logger with initial level
    let logger = LogBuilder::new()
        .targets([
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::LogDir { file_name: None }),
            Target::new(TargetKind::Webview),
        ])
        .level(initial_level)
        .build();

    // Set initial global level
    log::set_max_level(initial_level);

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![set_log_level])
        .plugin(logger)
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("Some error occured while running application");
}
