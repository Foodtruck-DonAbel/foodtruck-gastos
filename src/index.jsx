import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import Menu from './Menu.jsx';

const isMenu = window.location.pathname === '/menu';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {isMenu ? <Menu /> : <App />}
  </React.StrictMode>
);
