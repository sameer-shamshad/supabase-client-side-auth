'use client';
import { Store } from '@/store/store';
import { Provider } from 'react-redux';
import React, { useEffect } from 'react'
import Navigation from '@/components/Navigation';

const App = ({ children }: { children: React.ReactNode }) => {

  useEffect(() => {
    document.documentElement.classList.add('dark-mode');
  }, []);

  return (
    <section className='min-h-screen bg-background border'>
      <Navigation />
      {children}
    </section>
  );
};

export default App;
