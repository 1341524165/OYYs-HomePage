import React, { useEffect, useRef, useState } from 'react';

declare global {
	interface Window {
		netlifyIdentity: any;
	}
}

const NetlifyAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const widgetOpenRef = useRef(false);

	// 统一的显示名计算
	const getDisplayName = (u: any): string => {
		if (!u) return '';
		return (
			u?.user_metadata?.full_name ||
			u?.user_metadata?.fullName ||
			u?.email ||
			''
		);
	};

	useEffect(() => {
		// 立即清理可能存在的残留覆盖层
		const cleanupOverlays = () => {
			// 如果身份窗口正在打开，跳过清理，避免瞬间被移除
			if (widgetOpenRef.current) return;

			// 清理所有 Netlify 相关元素（保持 widget 但禁用交互）
			const overlays = document.querySelectorAll(
				'[id*="netlify"], [class*="netlify"], iframe[src*="netlify"], iframe[title*="identity"]'
			);
			overlays.forEach(el => {
				if ((el as HTMLElement).id === 'netlify-identity-widget') {
					const htmlEl = el as HTMLElement;
					htmlEl.style.display = 'none';
					htmlEl.style.pointerEvents = 'none';
					htmlEl.style.zIndex = '-9999';
				} else {
					el.parentElement?.removeChild(el);
				}
			});

			// 恢复页面交互
			document.body.style.overflow = '';
			document.body.style.pointerEvents = '';
			document.documentElement.style.overflow = '';
			document.documentElement.style.pointerEvents = '';
		};

		cleanupOverlays();

		// 动态加载 Netlify Identity 脚本
		const script = document.createElement('script');
		script.src =
			'https://identity.netlify.com/v1/netlify-identity-widget.js';
		script.async = true;

		script.onload = () => {
			if (window.netlifyIdentity) {
				window.netlifyIdentity.init();

				// 初始化：有用户则设置
				window.netlifyIdentity.on('init', (u: any) => {
					setUser(u || window.netlifyIdentity.currentUser());
					setLoading(false);
				});

				// 检查当前用户（作为兜底）
				const currentUser = window.netlifyIdentity.currentUser();
				setUser(currentUser);
				setLoading(false);

				// 打开/关闭事件：仅在关闭后做清理
				window.netlifyIdentity.on('open', () => {
					widgetOpenRef.current = true;
				});
				window.netlifyIdentity.on('close', () => {
					widgetOpenRef.current = false;
					cleanupOverlays();
				});

				// 监听登录事件
				window.netlifyIdentity.on('login', (loggedIn: any) => {
					// 使用事件提供的用户，随后再刷新一次，确保带有完整字段
					setUser(loggedIn);
					setError('');
					widgetOpenRef.current = false;
					setTimeout(() => {
						try {
							window.netlifyIdentity.close();
							const refreshed =
								window.netlifyIdentity.currentUser();
							if (refreshed) setUser(refreshed);
							cleanupOverlays();
						} catch {}
					}, 200);
				});

				// 监听登出事件
				window.netlifyIdentity.on('logout', () => {
					setUser(null);
					setError('');
					widgetOpenRef.current = false;
					cleanupOverlays();
				});

				// 监听错误事件
				window.netlifyIdentity.on('error', (err: any) => {
					setError('认证服务出现问题，请稍后重试');
					setLoading(false);
				});
			}
		};

		script.onerror = () => {
			setError('无法加载认证服务');
			setLoading(false);
		};

		document.head.appendChild(script);

		// 定期清理任务，避免残留（窗口打开时跳过）
		const intervalCleanup = setInterval(() => {
			if (!widgetOpenRef.current) cleanupOverlays();
		}, 1500);

		// 添加全局点击监听器作为最后保障（窗口打开时跳过）
		const handleGlobalClick = () => {
			if (!widgetOpenRef.current) cleanupOverlays();
		};

		const timer = setTimeout(() => {
			document.addEventListener('click', handleGlobalClick, true);
		}, 2000);

		return () => {
			if (document.head.contains(script)) {
				document.head.removeChild(script);
			}
			clearTimeout(timer);
			clearInterval(intervalCleanup);
			document.removeEventListener('click', handleGlobalClick, true);
		};
	}, []);

	const handleLogin = () => {
		if (window.netlifyIdentity) {
			widgetOpenRef.current = true; // 预防清理器误删
			window.netlifyIdentity.open();
		}
	};

	const handleLogout = () => {
		if (window.netlifyIdentity) {
			window.netlifyIdentity.logout();
		}
	};

	// 检查当前路径是否需要保护
	const isProtectedPath = () => {
		if (typeof window === 'undefined') return false;
		const path = window.location.pathname.toLowerCase();
		return path.includes('/docs/study/vg-teaching');
	};

	// 如果不是受保护路径，直接显示内容
	if (!isProtectedPath()) {
		return <>{children}</>;
	}

	// 加载中
	if (loading) {
		return (
			<div
				style={{
					padding: '2rem',
					textAlign: 'center',
					fontSize: '1.2rem',
					color: 'var(--ifm-color-primary)',
				}}
			>
				正在验证访问权限...
			</div>
		);
	}

	// 错误状态
	if (error) {
		return (
			<div
				style={{
					maxWidth: '500px',
					margin: '2rem auto',
					padding: '2rem',
					border: '2px solid #ff6b6b',
					borderRadius: '12px',
					textAlign: 'center',
					background: 'var(--ifm-hero-background-color)',
				}}
			>
				<h2>⚠️ 认证服务不可用</h2>
				<p>{error}</p>
				<button
					onClick={() => window.location.reload()}
					style={{
						padding: '0.8rem 1.5rem',
						backgroundColor: '#ff6b6b',
						color: 'white',
						border: 'none',
						borderRadius: '6px',
						fontSize: '1rem',
						cursor: 'pointer',
					}}
				>
					重新加载
				</button>
			</div>
		);
	}

	// 未登录
	if (!user) {
		return (
			<div
				style={{
					maxWidth: '500px',
					margin: '2rem auto',
					padding: '2rem',
					border: '2px solid var(--ifm-color-primary)',
					borderRadius: '12px',
					textAlign: 'center',
					background: 'var(--ifm-hero-background-color)',
				}}
			>
				<h2>🔒 Game Design 教学内容需要登录访问</h2>
				<p>
					为了保护学生隐私，此内容需要通过 Netlify Identity 验证身份。
				</p>
				<button
					onClick={handleLogin}
					style={{
						padding: '1rem 2rem',
						backgroundColor: 'var(--ifm-color-primary)',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						fontSize: '1.1rem',
						cursor: 'pointer',
						margin: '1.5rem 0',
					}}
				>
					登录 / 注册
				</button>
				<p style={{ fontSize: '0.9rem', opacity: '0.8' }}>
					如果您是学生，请联系老师将您的邮箱添加到访问列表
				</p>
			</div>
		);
	}

	// 已登录，显示内容
	return (
		<div>
			<div
				style={{
					background: 'var(--ifm-color-primary)',
					color: 'white',
					padding: '0.5rem 1rem',
					borderRadius: '6px',
					margin: '1rem 0',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<span>✅ 已验证访问 - {getDisplayName(user) || '已登录'}</span>
				<button
					onClick={handleLogout}
					style={{
						background: 'transparent',
						border: '1px solid white',
						color: 'white',
						padding: '0.3rem 0.8rem',
						borderRadius: '4px',
						cursor: 'pointer',
						fontSize: '0.9rem',
					}}
				>
					登出
				</button>
			</div>
			{children}
		</div>
	);
};

export default NetlifyAuth;
