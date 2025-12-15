'use client';
import { store } from '@/store/store';
import { Provider } from 'react-redux';
import React, { useEffect } from 'react'
import Navigation from '@/components/Navigation';
import { useAppDispatch } from '@/store/hooks';
import { initializeAuth } from '@/store/features/AuthReducer';

const AppContent = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    document.documentElement.classList.add('dark-mode');
    
    // Initialize auth state on mount (check session and load from localStorage)
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <section className='min-h-screen bg-background border'>
      <Navigation />
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
