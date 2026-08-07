use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter, State};

/// Terminal session writer (thread-safe)
pub struct TerminalWriter {
    writer: Mutex<Box<dyn Write + Send>>,
}

impl TerminalWriter {
    pub fn write(&self, data: &[u8]) -> Result<(), String> {
        let mut writer = self.writer.lock().unwrap();
        writer
            .write_all(data)
            .map_err(|e| format!("Failed to write: {}", e))?;
        writer
            .flush()
            .map_err(|e| format!("Failed to flush: {}", e))?;
        Ok(())
    }
}

/// State to hold all terminal sessions
pub struct TerminalState {
    pub writers: Mutex<HashMap<String, Arc<TerminalWriter>>>,
    pub masters: Mutex<HashMap<String, Box<dyn MasterPty + Send>>>,
    pub next_id: Mutex<u32>,
    pub running: Mutex<HashMap<String, bool>>,
}

impl Default for TerminalState {
    fn default() -> Self {
        Self {
            writers: Mutex::new(HashMap::new()),
            masters: Mutex::new(HashMap::new()),
            next_id: Mutex::new(1),
            running: Mutex::new(HashMap::new()),
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TerminalSpawnResult {
    pub id: String,
    pub success: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TerminalData {
    pub id: String,
    pub data: String,
}

/// Spawn a new terminal session
#[tauri::command]
pub fn terminal_spawn(
    app: AppHandle,
    state: State<'_, TerminalState>,
    cwd: Option<String>,
    shell: Option<String>,
    args: Option<Vec<String>>,
    cols: Option<u16>,
    rows: Option<u16>,
) -> Result<TerminalSpawnResult, String> {
    let pty_system = native_pty_system();

    let size = PtySize {
        rows: rows.unwrap_or(24),
        cols: cols.unwrap_or(80),
        pixel_width: 0,
        pixel_height: 0,
    };

    let pty_pair = pty_system
        .openpty(size)
        .map_err(|e| format!("Failed to open PTY: {}", e))?;

    // Determine shell to use
    let shell_path =
        shell.unwrap_or_else(|| std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string()));

    let mut cmd = CommandBuilder::new(&shell_path);
    match args {
        Some(extra_args) if !extra_args.is_empty() => {
            for arg in extra_args {
                cmd.arg(arg);
            }
        }
        _ => {
            cmd.arg("-l"); // Login shell
        }
    }

    // Set working directory
    if let Some(dir) = cwd {
        cmd.cwd(dir);
    } else if let Some(home) = dirs::home_dir() {
        cmd.cwd(home);
    }

    // Set environment variables
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");

    // Spawn the shell
    let mut child = pty_pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn shell: {}", e))?;

    let master = pty_pair.master;

    let writer = master
        .take_writer()
        .map_err(|e| format!("Failed to get PTY writer: {}", e))?;

    let mut reader = master
        .try_clone_reader()
        .map_err(|e| format!("Failed to get PTY reader: {}", e))?;

    // Generate session ID
    let mut next_id = state.next_id.lock().unwrap();
    let id = format!("term_{}", *next_id);
    *next_id += 1;
    drop(next_id);

    let terminal_writer = Arc::new(TerminalWriter {
        writer: Mutex::new(writer),
    });
    state.writers.lock().unwrap().insert(id.clone(), terminal_writer);
    state.masters.lock().unwrap().insert(id.clone(), master);
    state.running.lock().unwrap().insert(id.clone(), true);

    // Spawn reader thread to emit events
    let session_id = id.clone();
    let app_handle = app.clone();
    thread::spawn(move || {
        let mut buffer = [0u8; 4096];
        loop {
            match reader.read(&mut buffer) {
                Ok(0) => {
                    let _ = app_handle.emit(
                        "terminal-closed",
                        TerminalData {
                            id: session_id.clone(),
                            data: String::new(),
                        },
                    );
                    break;
                }
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buffer[..n]).to_string();
                    let _ = app_handle.emit(
                        "terminal-data",
                        TerminalData {
                            id: session_id.clone(),
                            data,
                        },
                    );
                }
                Err(e) => {
                    eprintln!("Terminal read error: {}", e);
                    break;
                }
            }
        }
        drop(reader);
        let _ = child.wait();
    });

    Ok(TerminalSpawnResult { id, success: true })
}

/// Write data to a terminal session
#[tauri::command]
pub fn terminal_write(
    state: State<'_, TerminalState>,
    id: String,
    data: String,
) -> Result<(), String> {
    let writers = state.writers.lock().unwrap();
    let writer = writers
        .get(&id)
        .ok_or_else(|| format!("Terminal session not found: {}", id))?;

    writer.write(data.as_bytes())
}

/// Resize a terminal session
#[tauri::command]
pub fn terminal_resize(
    state: State<'_, TerminalState>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let masters = state.masters.lock().unwrap();
    if let Some(master) = masters.get(&id) {
        master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Failed to resize PTY session {}: {}", id, e))?;
    }
    Ok(())
}

/// Close a terminal session
#[tauri::command]
pub fn terminal_close(state: State<'_, TerminalState>, id: String) -> Result<(), String> {
    state.running.lock().unwrap().insert(id.clone(), false);
    state.writers.lock().unwrap().remove(&id);
    state.masters.lock().unwrap().remove(&id);
    Ok(())
}

/// List all active terminal sessions
#[tauri::command]
pub fn terminal_list(state: State<'_, TerminalState>) -> Vec<String> {
    state
        .writers
        .lock()
        .unwrap()
        .keys()
        .cloned()
        .collect()
}
