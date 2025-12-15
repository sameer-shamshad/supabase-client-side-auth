import { assign, setup } from "xstate";

const THEME_STORAGE_KEY = 'isDarkMode';

// Get initial theme: localStorage > system > default (light)
const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check localStorage first
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'true' || stored === 'false') {
    return stored === 'true';
  }
  
  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  
  // Default to light (false)
  return false;
};

const initialContext = {
  isDarkMode: getInitialTheme(),
};

const themeMachine = setup({
  types: {
    context: {} as {
      isDarkMode: boolean;
    },
    events: {} as
      | { type: 'TOGGLE' }
      | { type: 'SET_LIGHT' }
      | { type: 'SET_DARK' }
      | { type: 'INIT' },
  },
  actions: {
    applyTheme: assign(({ context }) => {
      const root = document.documentElement;
      
      if (context.isDarkMode) {
        root.classList.add('dark-mode');
        root.classList.remove('light-mode');
      } else {
        root.classList.add('light-mode');
        root.classList.remove('dark-mode');
      }
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, String(context.isDarkMode));
      }
      
      return context;
    }),
    toggleTheme: assign(({ context }) => ({
      isDarkMode: !context.isDarkMode,
    })),
    setLight: assign(() => ({ isDarkMode: false })),
    setDark: assign(() => ({ isDarkMode: true })),
    initializeTheme: assign(() => {
      const isDarkMode = getInitialTheme();
      const root = document.documentElement;
      
      if (isDarkMode) {
        root.classList.add('dark-mode');
        root.classList.remove('light-mode');
      } else {
        root.classList.add('light-mode');
        root.classList.remove('dark-mode');
      }
      
      return { isDarkMode };
    }),
  },
}).createMachine({
  id: 'themeMachine',
  initial: 'idle',
  context: initialContext,
  states: {
    idle: {
      entry: 'initializeTheme',
      on: {
        TOGGLE: {
          actions: ['toggleTheme', 'applyTheme'],
        },
        SET_LIGHT: {
          actions: ['setLight', 'applyTheme'],
        },
        SET_DARK: {
          actions: ['setDark', 'applyTheme'],
        },
        INIT: {
          actions: 'initializeTheme',
        },
      },
    },
  },
});

export default themeMachine;

