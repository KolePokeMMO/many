import subprocess
import time
import os
import sys
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import threading

class MkdocsReloader(FileSystemEventHandler):
    def __init__(self):
        self.server = None
        self.debounce_timer = None
        self.restart_lock = threading.Lock()
        self.start_server()

    def start_server(self):
        print("🚀 Starting MkDocs server...")
        self.server = subprocess.Popen(
            [sys.executable, "-m", "mkdocs", "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW
        )

    def restart_server(self):
        with self.restart_lock:
            if self.server:
                self.server.kill()
                self.server.wait()
            print("🔁 Restarting MkDocs server...")
            self.start_server()

    def on_any_event(self, event):
        if not event.is_directory and event.src_path.endswith(('.css', '.js', '.yaml', '.yml', '.md', '.html')):
            # Debounce multiple rapid events
            if self.debounce_timer:
                self.debounce_timer.cancel()
            self.debounce_timer = threading.Timer(1.0, self.restart_server)
            self.debounce_timer.start()

if __name__ == "__main__":
    observer = Observer()
    event_handler = MkdocsReloader()
    observer.schedule(event_handler, path=".", recursive=True)

    print("👁️ Watching for changes... Press Ctrl+C to quit.")
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        if event_handler.server:
            event_handler.server.kill()
            event_handler.server.wait()
        print("\n👋 Stopped.")

    observer.join()