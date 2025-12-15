'use client';
import { store } from '@/store/store';
import { Provider } from 'react-redux';
import React, { useEffect } from 'react'
import { useMachine } from '@xstate/react';
import { useAppDispatch } from '@/store/hooks';
import { initializeAuth } from '@/store/features/AuthReducer';
import themeMachine from '@/machines/ThemeMachine';

const AppContent = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const [, themeSend] = useMachine(themeMachine);

  useEffect(() => {
    // Initialize theme on mount
    themeSend({ type: 'INIT' });
    
    // Initialize auth state on mount (check session and load from localStorage)
    dispatch(initializeAuth());
  }, [dispatch, themeSend]);

  return (
    <section className='min-h-screen bg-background'>
      {children}
    </section>
  );
};

const App = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <AppContent>{children}</AppContent>
    </Provider>
  );
};

export default App;
