import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Suppress Gun.js WebSocket connection errors
// Gun.js automatically falls back to HTTP/HTTPS when WebSocket fails
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Override console.error to filter out Gun.js WebSocket errors
console.error = (...args: any[]) => {
  const message = JSON.stringify(args);
  // Filter out all Gun.js WebSocket-related errors
  if (message.includes('WebSocket') ||
      message.includes('wss://') ||
      message.includes('ws://') ||
      message.includes('gun-manhattan') ||
      message.includes('gun-us.herokuapp') ||
      message.includes('gunjs.herokuapp') ||
      message.includes('gundb.herokuapp') ||
      message.includes('peer.wallie.io') ||
      message.includes('relay.peer.ooo')) {
    return; // Suppress these errors
  }
  originalConsoleError.apply(console, args);
};

// Override console.warn for completeness
console.warn = (...args: any[]) => {
  const message = JSON.stringify(args);
  // Filter out all Gun.js WebSocket-related warnings
  if (message.includes('WebSocket') ||
      message.includes('wss://') ||
      message.includes('ws://') ||
      message.includes('gun-manhattan') ||
      message.includes('gun-us.herokuapp') ||
      message.includes('gunjs.herokuapp') ||
      message.includes('gundb.herokuapp') ||
      message.includes('peer.wallie.io') ||
      message.includes('relay.peer.ooo')) {
    return; // Suppress these warnings
  }
  originalConsoleWarn.apply(console, args);
};

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => {
    // Use original error to bypass filter for bootstrap errors
    originalConsoleError(err);
  });
