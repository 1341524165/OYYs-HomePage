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

	// temporarily refresh user until the user is fully loaded,
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
		// 清理残留覆盖层，但保留核心组件
		const cleanupOverlays = () => {
			if (widgetOpenRef.current) return;

			// 不删除iframe，而是通过CSS控制它们的可见性
			// 仅显示最后一个（活动）widget，其他隐藏
			const widgets = document.querySelectorAll(
				'iframe[id="netlify-identity-widget"]'
			);

			// 将所有widget设置为不可见且不阻挡点击
			widgets.forEach((widget, index) => {
				const htmlWidget = widget as HTMLElement;
				// 保留最后一个widget作为活跃的，其他的完全隐藏
				if (index === widgets.length - 1) {
					htmlWidget.style.display = 'none';
					htmlWidget.style.pointerEvents = 'none';
					htmlWidget.style.zIndex = '-9999';
				} else {
					// 完全隐藏其他widget
					htmlWidget.style.display = 'none';
					htmlWidget.style.pointerEvents = 'none';
					htmlWidget.style.zIndex = '-9999';
					htmlWidget.style.visibility = 'hidden';
				}
			});

			// 经典防御式.. - 清理其他可能阻塞的元素
			const problematicElements = document.querySelectorAll(
				'iframe[src*="netlify"]:not([id="netlify-identity-widget"]), ' +
					'[class*="netlify"][style*="position: fixed"], ' +
					'[style*="z-index"][style*="9999"]:not([id*="netlify-identity-widget"])'
			);

			problematicElements.forEach(el => {
				try {
					if (el.parentElement) {
						el.parentElement.removeChild(el);
					}
				} catch {}
			});

			// 重置body样式
			document.body.style.overflow = '';
			document.body.style.pointerEvents = '';
			document.documentElement.style.overflow = '';
			document.documentElement.style.pointerEvents = '';
		};

		// cleanupOverlays();

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

					// 立即清理所有可能阻挡的元素
					setTimeout(() => {
						try {
							window.netlifyIdentity.close();
							cleanupOverlays();

							// 只清理空的netlify-identity-widget iframe
							const widgets = document.querySelectorAll(
								'iframe[id="netlify-identity-widget"]'
							);
							widgets.forEach(iframe => {
								try {
									// 检查iframe内部是否有内容
									const iframeDoc = (
										iframe as HTMLIFrameElement
									).contentDocument;
									const iframeBody = iframeDoc?.body;

									// 如果body为空或只有空白内容，则隐藏这个iframe
									if (
										!iframeBody ||
										iframeBody.innerHTML.trim() === '' ||
										iframeBody.children.length === 0
									) {
										const htmlIframe =
											iframe as HTMLElement;
										htmlIframe.style.display = 'none';
										htmlIframe.style.pointerEvents = 'none';
										htmlIframe.style.zIndex = '-9999';
									}
								} catch (e) {
									// 如果无法访问iframe内容（跨域限制），则跳过
								}
							});

							// 重置所有可能被修改的样式
							document.body.style.overflow = '';
							document.body.style.pointerEvents = '';
							document.documentElement.style.overflow = '';
							document.documentElement.style.pointerEvents = '';
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

		// 清理 background (遮罩层)
		// 循环检查，如果认证弹窗没开，cleanupOverlays()
		const intervalCleanup = setInterval(() => {
			if (!widgetOpenRef.current) cleanupOverlays();
		}, 1500);

		// 定义一个全局点击事件处理函数，如果认证弹窗没开，也清理遮罩层
		const handleGlobalClick = () => {
			if (!widgetOpenRef.current) cleanupOverlays();
		};

		// 等2s再加一个点击事件监听，调用上面的全局点击处理函数
		const timer = setTimeout(() => {
			document.addEventListener('click', handleGlobalClick, true);
		}, 2000);

		// 返回一个清理函数，卸载时移除 script、定时器、事件监听
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
			try {
				// 重新激活所有netlify-identity-widget iframe
				const widgets = document.querySelectorAll(
					'iframe[id="netlify-identity-widget"]'
				);
				widgets.forEach((widget, index) => {
					const htmlWidget = widget as HTMLElement;
					// 重置所有样式，让Netlify Identity重新控制
					htmlWidget.style.display = '';
					htmlWidget.style.pointerEvents = '';
					htmlWidget.style.zIndex = '';
					htmlWidget.style.visibility = '';
				});

				widgetOpenRef.current = true;
				window.netlifyIdentity.open();
			} catch (error) {
				console.error('登录失败:', error);
				// 尝试重新初始化
				if (window.netlifyIdentity.init) {
					window.netlifyIdentity.init();
					setTimeout(() => {
						widgetOpenRef.current = true;
						window.netlifyIdentity.open();
					}, 500);
				}
			}
		} else {
			console.error('Netlify Identity 未加载');
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
