use tauri::menu::{AboutMetadata, Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{Emitter, Manager};

mod terminal;

#[tauri::command]
fn app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn get_home_directory() -> Option<std::path::PathBuf> {
    dirs::home_dir()
}

/// Menu item ids are emitted to the webview as `menu://<id>` events.
/// The frontend routes them through its command registry (turtlecode pattern:
/// one registry, three input surfaces — keydown, palette, native menu).
fn build_menu(app: &tauri::App) -> tauri::Result<Menu<tauri::Wry>> {
    let about = PredefinedMenuItem::about(
        app,
        Some("Grid"),
        Some(AboutMetadata {
            name: Some("Grid".into()),
            version: Some(env!("CARGO_PKG_VERSION").into()),
            comments: Some("Hyper-flexible WM-style information surface".into()),
            ..Default::default()
        }),
    )?;

    let new_terminal: MenuItem<tauri::Wry> =
        MenuItem::with_id(app, "new-terminal", "New Terminal", true, Some("CmdOrCtrl+N"))?;
    let close_window: MenuItem<tauri::Wry> =
        MenuItem::with_id(app, "close-window", "Close Window", true, Some("CmdOrCtrl+W"))?;
    let clear_all: MenuItem<tauri::Wry> =
        MenuItem::with_id(app, "clear-all", "Clear All Windows", true, None::<String>)?;
    let quit = PredefinedMenuItem::quit(app, Some("Quit Grid"))?;

    let file = Submenu::with_items(
        app,
        "File",
        true,
        &[&new_terminal, &close_window, &clear_all, &PredefinedMenuItem::separator(app)?, &quit],
    )?;

    let palette = MenuItem::with_id(app, "palette", "Search & Commands…", true, Some("CmdOrCtrl+K"))?;
    let zen = MenuItem::with_id(app, "toggle-zen", "Zen Mode", true, Some("F11"))?;
    let layout_grid = MenuItem::with_id(app, "layout-grid", "Grid", true, Some("CmdOrCtrl+1"))?;
    let layout_canvas = MenuItem::with_id(app, "layout-freeform", "Canvas", true, Some("CmdOrCtrl+2"))?;
    let layout_niri = MenuItem::with_id(app, "layout-niri", "Niri", true, Some("CmdOrCtrl+3"))?;
    let layout_floating = MenuItem::with_id(app, "layout-floating", "Windows", true, Some("CmdOrCtrl+4"))?;
    let layout_fib = MenuItem::with_id(app, "layout-fibonacci", "Fibonacci", true, Some("CmdOrCtrl+5"))?;
    let layout_tabs = MenuItem::with_id(app, "layout-tabs", "Tabs", true, Some("CmdOrCtrl+6"))?;
    let layout_stack = MenuItem::with_id(app, "layout-stack", "Stack", true, Some("CmdOrCtrl+7"))?;

    let view = Submenu::with_items(
        app,
        "View",
        true,
        &[
            &palette,
            &zen,
            &PredefinedMenuItem::separator(app)?,
            &layout_grid,
            &layout_canvas,
            &layout_niri,
            &layout_floating,
            &layout_fib,
            &layout_tabs,
            &layout_stack,
        ],
    )?;

    let menu = Menu::with_items(app, &[&about, &file, &view])?;
    Ok(menu)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(terminal::TerminalState::default())
        .invoke_handler(tauri::generate_handler![
            app_version,
            get_home_directory,
            terminal::terminal_spawn,
            terminal::terminal_write,
            terminal::terminal_resize,
            terminal::terminal_close,
            terminal::terminal_list,
        ])
        .setup(|app| {
            let menu = build_menu(app)?;
            app.set_menu(menu)?;
            if let Some(win) = app.get_webview_window("main") {
                win.show().ok();
                win.set_focus().ok();
            }
            Ok(())
        })
        .on_menu_event(|app, event| {
            // forward to the webview: frontend routes via its command registry
            let _ = app.emit("menu://command", event.id().0.clone());
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
