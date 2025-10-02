import { Auth0Provider } from '@auth0/auth0-react';
import React from 'react';

export default function Root({ children }) {
	// Check if we're in the browser
	if (typeof window === 'undefined') {
		// Server-side rendering - just return children
		return <>{children}</>;
	}

	// For local development, use different logic
	const isLocalhost =
		window.location.hostname === 'localhost' ||
		window.location.hostname === '127.0.0.1';

	// For localhost development, use simpler configuration or skip Auth0
	if (isLocalhost) {
		return <>{children}</>;
	}

	// Get environment variables safely
	const auth0Domain = 'dev-ux15rvdtiodhohz0.us.auth0.com';
	const auth0ClientId = 's5j4otEAFMrGWqZpun4sNiQ4sFzm1c8z';

	const onRedirectCallback = appState => {
		// Redirect to the page the user was on before login
		window.history.replaceState(
			{},
			document.title,
			appState?.returnTo || window.location.pathname
		);
	};

	return (
		<Auth0Provider
			domain={auth0Domain}
			clientId={auth0ClientId}
			authorizationParams={{
				redirect_uri: window.location.origin,
			}}
			cacheLocation="localstorage"
			useRefreshTokens={true}
			onRedirectCallback={onRedirectCallback}
		>
			{children}
		</Auth0Provider>
	);
}
