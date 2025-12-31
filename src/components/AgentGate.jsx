import { useSession } from '../AuthContext';
import { Navigate } from 'react-router-dom';

export default function AgentGate({ children }) {
  const session = useSession();

  if (!session) {
    return <Navigate to="/agent/login" replace />;
  }

  return children;
}
