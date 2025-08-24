import React, { useEffect } from 'react';

export default function Root({ children }) {
	useEffect(() => {
		// 检查是否已经加载过脚本
		if (document.querySelector('script[src*="netlify-identity-widget"]')) {
			return;
		}

		// 动态加载Netlify Identity脚本
		const script = document.createElement('script');
		script.src =
			'https://identity.netlify.com/v1/netlify-identity-widget.js';
		script.async = true;
		script.onload = () => {
			console.log('Netlify Identity 脚本加载完成');
		};
		script.onerror = () => {
			console.error('Netlify Identity 脚本加载失败');
		};
		document.head.appendChild(script);

		return () => {
			// 清理脚本
			if (document.head.contains(script)) {
				document.head.removeChild(script);
			}
		};
	}, []);

	return <>{children}</>;
}
