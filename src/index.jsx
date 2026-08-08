import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import Menu from './Menu.jsx';
import Pedidos from './Pedidos.jsx';

const path = window.location.pathname;
const Component = path === '/menu' ? Menu : path === '/pedidos' ? Pedidos : App;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><Component /></React.StrictMode>);
