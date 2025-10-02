import { Auth0Provider } from '@auth0/auth0-react';
import React from 'react';

export default function Root({ children }) {
	// For local development, use different logic
	const isLocalhost =
		window.location.hostname === 'localhost' ||
		window.location.hostname === '127.0.0.1';

	// Safe environment variable access for browser
	const getEnvVar = (key: string, fallback: string) => {
		// @ts-ignore - process may not be defined in browser
		return typeof process !== 'undefined' && process.env && process.env[key]
			? process.env[key]
			: fallback;
	};

	// For localhost development, use simpler configuration or skip Auth0
	if (isLocalhost) {
		return <>{children}</>;
	}

	return (
		<Auth0Provider
			domain={getEnvVar(
				'REACT_APP_AUTH0_DOMAIN',
				process.env.REACT_APP_AUTH0_DOMAIN ||
					'your-auth0-domain.auth0.com'
			)}
			clientId={getEnvVar(
				'REACT_APP_AUTH0_CLIENT_ID',
				process.env.REACT_APP_AUTH0_CLIENT_ID || 'your-auth0-client-id'
			)}
			authorizationParams={{
				redirect_uri: `${window.location.origin}/.netlify/functions/auth-callback`,
			}}
			cacheLocation="localstorage"
		>
			{children}
		</Auth0Provider>
	);
}
