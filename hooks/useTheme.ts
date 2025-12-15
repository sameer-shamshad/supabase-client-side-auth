import { useMachine } from '@xstate/react';
import { useEffect } from 'react';
import themeMachine from '@/machines/ThemeMachine';

/**
 * Custom hook for theme management
 * 
 * Usage:
 * ```tsx
 * import useTheme from '@/hooks/useTheme';
 * 
 * function MyComponent() {
 *   const { isDarkMode, toggleTheme, setLight, setDark } = useTheme();
 *   
 *   return (
 *     <button onClick={toggleTheme}>
 *       {isDarkMode ? 'Dark' : 'Light'} Mode
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme() {
  const [state, send] = useMachine(themeMachine);

  // Initialize theme on mount
  useEffect(() => {
    send({ type: 'INIT' });
  }, [send]);

  return {
    isDarkMode: state.context.isDarkMode,
    toggleTheme: () => send({ type: 'TOGGLE' }),
    setLight: () => send({ type: 'SET_LIGHT' }),
    setDark: () => send({ type: 'SET_DARK' }),
  };
}

