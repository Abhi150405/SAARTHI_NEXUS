import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

const ThemeToggle = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            className="floating-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
            {theme === 'light' ? (
                <div className="toggle-content">
                    <Moon size={20} />
                </div>
            ) : (
                <div className="toggle-content">
                    <Sun size={20} />
                </div>
            )}
        </button>
    );
};

export default ThemeToggle;
