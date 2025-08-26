import React, { useEffect, useRef, useState } from 'react';

declare global {
	interface Window {
		netlifyIdentity: any;
	}
}

const NetlifyAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<any>(null);
	const [displayName, setDisplayName] = useState<string>('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const widgetOpenRef = useRef(false);

	// 统一的显示名计算
	const computeDisplayName = (u: any): string => {
		if (!u) return '';
		return (
			u?.user_metadata?.full_name ||
			u?.user_metadata?.fullName ||
			u?.user_metadata?.name ||
			u?.email ||
			u?.id ||
			''
		);
	};

	// temporarily refresh user until the user is fully loaded,,
	const refreshUserWithRetries = (retries: number = 20) => {
		try {
			const u = window.netlifyIdentity?.currentUser();
			const name = computeDisplayName(u);
			if (u && name) {
				setUser(u);
				setDisplayName(name);
				return;
			}
		} catch {}
		if (retries > 0) {
			setTimeout(() => refreshUserWithRetries(retries - 1), 150);
		}
	};

	useEffect(() => {
		// 立即清理可能存在的残留覆盖层
		const cleanupOverlays = () => {
			if (widgetOpenRef.current) return;
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
			document.body.style.overflow = '';
			document.body.style.pointerEvents = '';
			document.documentElement.style.overflow = '';
			document.documentElement.style.pointerEvents = '';
		};

		cleanupOverlays();

		const script = document.createElement('script');
		script.src =
			'https://identity.netlify.com/v1/netlify-identity-widget.js';
		script.async = true;

		script.onload = () => {
			if (window.netlifyIdentity) {
				window.netlifyIdentity.init();

				// 初始化：有用户则设置
				window.netlifyIdentity.on('init', (u: any) => {
					const resolved = u || window.netlifyIdentity.currentUser();
					setUser(resolved);
					setDisplayName(computeDisplayName(resolved));
					setLoading(false);
					// 若显示名为空，短暂轮询补齐
					if (!computeDisplayName(resolved)) {
						refreshUserWithRetries();
					}
				});

				// 兜底获取当前用户
				const currentUser = window.netlifyIdentity.currentUser();
				setUser(currentUser);
				setDisplayName(computeDisplayName(currentUser));
				setLoading(false);
				if (currentUser && !computeDisplayName(currentUser)) {
					refreshUserWithRetries();
				}

				window.netlifyIdentity.on('open', () => {
					widgetOpenRef.current = true;
				});
				window.netlifyIdentity.on('close', () => {
					widgetOpenRef.current = false;
					cleanupOverlays();
				});

				// 登录：先用事件里的数据立即渲染显示名，再刷新
				window.netlifyIdentity.on('login', (loggedIn: any) => {
					setError('');
					widgetOpenRef.current = false;
					setUser(loggedIn);
					setDisplayName(computeDisplayName(loggedIn));
					// 继续轮询，直到拿到完整的 user
					refreshUserWithRetries();
					setTimeout(() => {
						try {
							window.netlifyIdentity.close();
							cleanupOverlays();
						} catch {}
					}, 300);
				});

				window.netlifyIdentity.on('logout', () => {
					setUser(null);
					setDisplayName('');
					setError('');
					widgetOpenRef.current = false;
					cleanupOverlays();
				});

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

		const intervalCleanup = setInterval(() => {
			if (!widgetOpenRef.current) cleanupOverlays();
		}, 1500);

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
			widgetOpenRef.current = true;
			window.netlifyIdentity.open();
		}
	};

	const handleLogout = () => {
		if (window.netlifyIdentity) {
			window.netlifyIdentity.logout();
		}
	};

	const isProtectedPath = () => {
		if (typeof window === 'undefined') return false;
		const path = window.location.pathname.toLowerCase();
		return path.includes('/docs/study/vg-teaching');
	};

	if (!isProtectedPath()) {
		return <>{children}</>;
	}

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
				<span>✅ 已验证访问 - {displayName || '已登录'}</span>
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
