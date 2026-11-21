import { BrowserRouter } from 'react-router';
import { AppProvider } from './context/AppContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import AppRoutes from './routes';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppProvider>
          <AdminAuthProvider>
            <AppRoutes />
          </AdminAuthProvider>
        </AppProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
