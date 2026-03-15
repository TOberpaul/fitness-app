import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { handleCallback } from '../services/fitbitService';

type CallbackState = 'loading' | 'error';

export default function FitbitCallbackView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const oauthState = searchParams.get('state');

    if (!code || !oauthState) {
      setErrorMessage('Missing authorization code or state parameter.');
      setState('error');
      return;
    }

    handleCallback(code, oauthState)
      .then(() => navigate('/', { replace: true }))
      .catch((err) => {
        setErrorMessage(
          err instanceof Error ? err.message : 'Failed to complete Fitbit authorization.'
        );
        setState('error');
      });
  }, [searchParams, navigate]);

  if (state === 'error') {
    return (
      <div className="adaptive">
        <h2>Authorization Failed</h2>
        <p>{errorMessage}</p>
        <Link to="/" data-interactive="">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="adaptive">
      <p>Connecting to Fitbit…</p>
    </div>
  );
}
