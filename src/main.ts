import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Suppress Gun.js WebSocket connection errors
// Gun.js automatically falls back to HTTP/HTTPS when WebSocket fails
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  // Filter out Gun.js WebSocket errors
  if (message.includes('WebSocket connection') ||
      message.includes('wss://') ||
      message.includes('gun-manhattan') ||
      message.includes('relay.peer.ooo')) {
    return; // Suppress these errors
  }
  originalConsoleError.apply(console, args);
};

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
