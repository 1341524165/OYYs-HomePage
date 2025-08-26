import React from 'react';
// @ts-ignore - resolved by Docusaurus at build time
import Content from '@theme-original/DocItem/Content';
import NetlifyAuth from '../../../components/NetlifyAuth';

export default function ContentWrapper(props) {
	return (
		<NetlifyAuth>
			<Content {...props} />
		</NetlifyAuth>
	);
}
