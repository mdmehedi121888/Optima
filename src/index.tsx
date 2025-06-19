// src/index.tsx
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
    <AuthProvider> {/* 👈 Wrap App with AuthProvider */}
      <App />
    </AuthProvider>
);

reportWebVitals();
