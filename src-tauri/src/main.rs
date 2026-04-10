#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(windows)]
use std::env;

#[cfg(windows)]
use winreg::enums::HKEY_CURRENT_USER;
#[cfg(windows)]
use winreg::RegKey;

#[cfg(windows)]
const STARTUP_VALUE_NAME: &str = "GitHub Widget";

#[cfg(windows)]
fn ensure_windows_startup_registration() -> Result<(), Box<dyn std::error::Error>> {
    if cfg!(debug_assertions) {
        return Ok(());
    }

    let current_exe = env::current_exe()?;
    let current_exe = format!("\"{}\"", current_exe.display());
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (run_key, _) = hkcu.create_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Run")?;
    let existing_value = run_key.get_value::<String, _>(STARTUP_VALUE_NAME).ok();

    if existing_value.as_deref() != Some(current_exe.as_str()) {
        run_key.set_value(STARTUP_VALUE_NAME, &current_exe)?;
    }

    Ok(())
}

fn main() {
    #[cfg(windows)]
    if let Err(error) = ensure_windows_startup_registration() {
        eprintln!("failed to register startup entry: {error}");
    }

    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
