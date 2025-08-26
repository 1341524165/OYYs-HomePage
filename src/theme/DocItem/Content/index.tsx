import React from 'react';
// @ts-ignore - resolved by Docusaurus at build time
import Content from '@theme-original/DocItem/Content';
import DocProtector from '../../../components/DocProtector';

export default function ContentWrapper(props) {
	return (
		<div suppressHydrationWarning>
			<DocProtector>
				<Content {...props} />
			</DocProtector>
		</div>
	);
}
