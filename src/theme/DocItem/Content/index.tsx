import React from 'react';
// @ts-ignore - resolved by Docusaurus at build time
import Content from '@theme-original/DocItem/Content';
import Auth0Auth from '../../../components/Auth0Auth';

export default function ContentWrapper(props) {
	// Check if we're in the browser
	if (typeof window === 'undefined') {
		// Server-side rendering - just return content without auth
		return <Content {...props} />;
	}

	// For localhost development, skip Auth0 authentication
	const isLocalhost =
		window.location.hostname === 'localhost' ||
		window.location.hostname === '127.0.0.1';

	if (isLocalhost) {
		return <Content {...props} />;
	}

	return (
		<Auth0Auth>
			<Content {...props} />
		</Auth0Auth>
	);
}
