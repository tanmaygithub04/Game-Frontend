import './App.css';
import Game from './components/Game';
import UserRegistration from './components/UserRegistration';
import { UserProvider, useUser } from './UserContext';

// Define a simple LoadingIndicator component
function LoadingIndicator() {
  return (
    <div className="loading-indicator">
      <div className="loading-spinner"></div>
      <p>Waking up the server...</p>
    </div>
  );
}

function AppContent() {
  const { user, loading: userLoading } = useUser(); // Rename loading to avoid conflict

  // Display loading indicator if user context is loading
  if (userLoading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="App">
      {!user ? <UserRegistration /> : <Game />}
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
