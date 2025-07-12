// App.jsx
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import UserContextProvider from "./contexts/UserContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SocketProvider } from './contexts/SocketContext';
import AppRoutes from '../src/components/AppRoutes';

function App() {
  return (
    <UserContextProvider>
      <SocketProvider> 
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <ToastContainer position="top-center" autoClose={3000} />
      </SocketProvider>
    </UserContextProvider>
  );
}

export default App;
