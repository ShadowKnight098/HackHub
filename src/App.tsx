import React, { useEffect } from 'react';
import { AppRoutes } from './routes';
import AOS from 'aos';
import 'aos/dist/aos.css';

export const App: React.FC = () => {
  useEffect(() => {
    AOS.init({
      duration: 750,
      easing: 'ease-out-cubic',
      once: false,
      offset: 30,
    });
  }, []);

  return <AppRoutes />;
};

export default App;
