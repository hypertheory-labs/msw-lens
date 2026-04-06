import { effect } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';

type AppUiState = {
  theme: 'dark' | 'nord';
  sidebarOpen: boolean;
};

const themeKey = 'app-theme';
const sidebarKey = 'app-sidebar';

const initialState = (): AppUiState => ({
  theme: 'dark',
  sidebarOpen: false,
});

export const appUiStore = signalStore(
  withState(initialState()),
  withMethods((store) => ({
    toggleTheme() {
      patchState(store, { theme: store.theme() === 'dark' ? 'nord' : 'dark' });
    },
    toggleSidebar() {
      patchState(store, { sidebarOpen: !store.sidebarOpen() });
    },
    setSidebar(open: boolean) {
      patchState(store, { sidebarOpen: open });
    },
  })),
  withHooks((store) => ({
    onInit() {
      const theme = (localStorage.getItem(themeKey) as 'dark' | 'nord') || 'dark';
      const sidebarOpen = localStorage.getItem(sidebarKey) === 'true';

      patchState(store, { theme, sidebarOpen });

      effect(() => {
        const themeSign = store.theme();
        const sidebarOpenSign = store.sidebarOpen();
        localStorage.setItem(sidebarKey, String(sidebarOpenSign));
        localStorage.setItem(themeKey, themeSign);
        document.documentElement.setAttribute('data-theme', themeSign);
      });
    },
  })),
);
