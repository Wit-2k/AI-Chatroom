// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandChild;
use std::sync::Mutex;

struct BackendProcess(Mutex<Option<CommandChild>>);

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            let shell = app.shell();

            // 获取项目根目录（src-tauri 的上两级 = 项目根目录）
            // 开发模式下使用 CARGO_MANIFEST_DIR 环境变量
            let backend_dir = if cfg!(debug_assertions) {
                let manifest_dir = env!("CARGO_MANIFEST_DIR");
                std::path::PathBuf::from(manifest_dir)
                    .parent()  // frontend/
                    .and_then(|p| p.parent())  // project root
                    .map(|p| p.to_path_buf())
                    .unwrap_or_else(|| std::path::PathBuf::from("."))
            } else {
                // 生产模式下，后端文件在资源目录中
                app.path()
                    .resource_dir()
                    .unwrap_or_else(|_| std::path::PathBuf::from("."))
            };

            println!("[tauri] Starting backend in: {:?}", backend_dir);

            let (mut rx, child) = shell
                .command("uvicorn")
                .args(["server:app", "--host", "127.0.0.1", "--port", "8000"])
                .current_dir(backend_dir)
                .spawn()
                .expect("Failed to start Python backend. Make sure uvicorn is installed.");

            // 存储子进程引用，用于关闭时清理
            let state = app.state::<BackendProcess>();
            *state.0.lock().unwrap() = Some(child);

            // 后台读取子进程输出
            tauri::async_runtime::spawn(async move {
                use tauri_plugin_shell::process::CommandEvent;
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            println!("[backend] {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Stderr(line) => {
                            eprintln!("[backend] {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Terminated(status) => {
                            println!("[backend] process exited: {:?}", status);
                            break;
                        }
                        _ => {}
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                let state = window.state::<BackendProcess>();
                let mut guard = state.0.lock().unwrap();
                if let Some(child) = guard.take() {
                    let _ = child.kill();
                    println!("[tauri] Backend process terminated");
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
