import React from 'react';
import Content from '@theme-original/DocItem/Content';
import DocProtector from '../../../components/DocProtector';

export default function ContentWrapper(props) {
	return (
		<DocProtector>
			<Content {...props} />
		</DocProtector>
	);
}
