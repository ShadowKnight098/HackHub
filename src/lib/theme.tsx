import React, { createContext, useContext, useEffect } from 'react';

type Theme = 'positivus';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'positivus',
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Purge any legacy theme overrides from localStorage
    localStorage.removeItem('hackhub-theme');
    document.documentElement.setAttribute('data-theme', 'positivus');
  }, []);

  const toggleTheme = () => {
    // Single theme locked as requested
  };

  const setTheme = () => {
    // Single theme locked as requested
  };

  return (
    <ThemeContext.Provider value={{ theme: 'positivus', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
