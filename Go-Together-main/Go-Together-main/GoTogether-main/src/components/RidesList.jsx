import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RidesList() {
  const navigate = useNavigate();

  // Redirect to the new Rides page
  useEffect(() => {
    navigate('/rides');
  }, [navigate]);

  return (
    <div className="text-center p-8">
      <p>Redirecting to rides page...</p>
    </div>
  );
} 