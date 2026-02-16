import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Storage key for user preference
  private readonly THEME_KEY = 'planning-poker-theme';

  // Signal to track current theme preference
  theme = signal<Theme>('auto');

  // Signal to track effective theme (resolved from 'auto')
  effectiveTheme = signal<'light' | 'dark'>('light');

  constructor() {
    // Load saved theme preference
    this.loadTheme();

    // Watch for theme changes and apply them
    effect(() => {
      this.applyTheme(this.theme());
    });

    // Listen for system theme changes
    this.setupSystemThemeListener();
  }

  /**
   * Set theme preference
   */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
    localStorage.setItem(this.THEME_KEY, theme);
  }

  /**
   * Toggle between light and dark (skip auto)
   */
  toggleTheme(): void {
    const current = this.effectiveTheme();
    const newTheme: Theme = current === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Load theme from localStorage
   */
  private loadTheme(): void {
    const saved = localStorage.getItem(this.THEME_KEY) as Theme | null;
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      this.theme.set(saved);
    } else {
      // Default to auto
      this.theme.set('auto');
    }
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    let effectiveTheme: 'light' | 'dark';

    if (theme === 'auto') {
      // Use system preference
      effectiveTheme = this.getSystemTheme();
    } else {
      effectiveTheme = theme;
    }

    this.effectiveTheme.set(effectiveTheme);

    // Apply to document
    const html = document.documentElement;
    html.classList.remove('light-theme', 'dark-theme');
    html.classList.add(`${effectiveTheme}-theme`);

    // Also set data attribute for CSS selectors
    html.setAttribute('data-theme', effectiveTheme);

    console.log(`[Theme Service] Applied theme: ${theme} (effective: ${effectiveTheme})`);
  }

  /**
   * Get system theme preference
   */
  private getSystemTheme(): 'light' | 'dark' {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Listen for system theme changes
   */
  private setupSystemThemeListener(): void {
    if (!window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Listen for changes
    mediaQuery.addEventListener('change', (e) => {
      // Only react if theme is set to auto
      if (this.theme() === 'auto') {
        const newTheme = e.matches ? 'dark' : 'light';
        this.effectiveTheme.set(newTheme);
        this.applyTheme('auto');
      }
    });
  }
}
