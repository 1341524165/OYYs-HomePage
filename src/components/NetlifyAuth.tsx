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
	const scriptLoadedRef = useRef(false);
	const initCompletedRef = useRef(false);

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
		// 清理所有重复的 Netlify Identity iframe，只保留一个
		const cleanupDuplicateIframes = () => {
			const widgets = document.querySelectorAll(
				'iframe[id="netlify-identity-widget"]'
			);

			// 如果有多个 iframe，隐藏多余的而不是删除
			if (widgets.length > 1) {
				for (let i = 0; i < widgets.length - 1; i++) {
					try {
						const widget = widgets[i] as HTMLElement;
						if (widget) {
							// 隐藏而不是删除
							widget.style.display = 'none !important';
							widget.style.pointerEvents = 'none';
							widget.style.zIndex = '-9999';
							widget.style.visibility = 'hidden';
						}
					} catch (e) {
						console.warn('Failed to hide duplicate iframe:', e);
					}
				}
			}

			// 不再干预主要的netlify-identity-widget样式
			// 让Netlify Identity完全管理其样式状态
		};

		// 清理其他可能阻塞的元素
		const cleanupOverlays = () => {
			if (widgetOpenRef.current) return;

			// 清理其他可能阻塞的元素，包括高z-index的元素
			const problematicElements = document.querySelectorAll(
				'iframe[src*="netlify"]:not([id="netlify-identity-widget"]), ' +
					'[class*="netlify"][style*="position: fixed"], ' +
					'[style*="z-index"][style*="9999"]:not([id*="netlify-identity-widget"]), ' +
					'[style*="z-index"][style*="99"]:not([id*="netlify-identity-widget"]), ' +
					'[style*="display: block !important"]'
			);

			problematicElements.forEach(el => {
				try {
					if (el.parentElement) {
						el.parentElement.removeChild(el);
					}
				} catch {}
			});

			// 不再干预主要的netlify-identity-widget，让Netlify Identity自己管理
			// 只处理其他可能的问题元素

			// 重置body样式
			document.body.style.overflow = '';
			document.body.style.pointerEvents = '';
			document.documentElement.style.overflow = '';
			document.documentElement.style.pointerEvents = '';

			// 移除可能的 modal 类
			document.body.classList.remove('netlify-identity-open');
			document.documentElement.classList.remove('netlify-identity-open');
		};

		cleanupDuplicateIframes();
		cleanupOverlays();

		// 检查是否已经加载过脚本
		const existingScript = document.querySelector(
			'script[src*="netlify-identity-widget.js"]'
		);

		let currentScript: HTMLScriptElement | null = null;

		if (!scriptLoadedRef.current && !existingScript) {
			scriptLoadedRef.current = true;

			currentScript = document.createElement('script');
			currentScript.src =
				'https://identity.netlify.com/v1/netlify-identity-widget.js';
			currentScript.async = true;

			currentScript.onload = () => {
				if (window.netlifyIdentity && !initCompletedRef.current) {
					initCompletedRef.current = true;
					window.netlifyIdentity.init();

					// 初始化：有用户则设置
					window.netlifyIdentity.on('init', (u: any) => {
						console.log(
							'Netlify Identity initialized with user:',
							u
						);
						const resolved =
							u || window.netlifyIdentity.currentUser();
						setUser(resolved);
						setDisplayName(computeDisplayName(resolved));
						setLoading(false);
						// 若显示名为空，短暂轮询补齐
						if (!computeDisplayName(resolved)) {
							refreshUserWithRetries();
						}
					});

					// 延迟检查当前用户状态，确保Netlify Identity完全初始化
					setTimeout(() => {
						const currentUser =
							window.netlifyIdentity.currentUser();
						console.log('Current user after init:', currentUser);
						if (currentUser) {
							setUser(currentUser);
							setDisplayName(computeDisplayName(currentUser));
							if (!computeDisplayName(currentUser)) {
								refreshUserWithRetries();
							}
						}
						setLoading(false);
					}, 500);

					window.netlifyIdentity.on('open', () => {
						widgetOpenRef.current = true;
						console.log('Netlify Identity widget opened');
					});
					window.netlifyIdentity.on('close', () => {
						widgetOpenRef.current = false;
						console.log('Netlify Identity widget closed');
						cleanupOverlays();
					});

					// 登录：先用事件里的数据立即渲染显示名，再刷新
					window.netlifyIdentity.on('login', (loggedIn: any) => {
						setError('');
						setUser(loggedIn);
						setDisplayName(computeDisplayName(loggedIn));
						// 继续轮询，直到拿到完整的 user
						refreshUserWithRetries();

						// 登录成功后，让Netlify Identity自然管理弹窗关闭
						// 不要强制干预，让用户看到成功的反馈
					});

					window.netlifyIdentity.on('logout', () => {
						setUser(null);
						setDisplayName('');
						setError('');
						widgetOpenRef.current = false;

						// 不要重置iframe样式，让Netlify Identity保持其内部状态
						// 只清理我们自己的多余iframe和overlay

						cleanupDuplicateIframes();
						cleanupOverlays();

						console.log(
							'Logged out, will refresh page to reset all states...'
						);

						// 刷新页面，确保Netlify Identity状态完全重置
						// 登录状态会通过localStorage自动恢复
						setTimeout(() => {
							window.location.reload();
						}, 200);
					});

					window.netlifyIdentity.on('error', (err: any) => {
						setError('认证服务出现问题，请稍后重试');
						setLoading(false);
					});
				} else if (window.netlifyIdentity && initCompletedRef.current) {
					// 如果脚本已经加载且初始化完成，直接获取当前用户状态
					const currentUser = window.netlifyIdentity.currentUser();
					setUser(currentUser);
					setDisplayName(computeDisplayName(currentUser));
					setLoading(false);
				}
			};

			if (currentScript) {
				currentScript.onerror = () => {
					setError('无法加载认证服务');
					setLoading(false);
				};

				document.head.appendChild(currentScript);
			}
		} else if (window.netlifyIdentity && initCompletedRef.current) {
			// 如果脚本已存在且已初始化，直接获取用户状态
			const currentUser = window.netlifyIdentity.currentUser();
			setUser(currentUser);
			setDisplayName(computeDisplayName(currentUser));
			setLoading(false);
		} else if (existingScript) {
			// 脚本已存在，等待Netlify Identity完全初始化
			// 页面刷新后可能需要更长时间来恢复状态
			setTimeout(() => {
				const checkInit = (retries: number = 10) => {
					if (window.netlifyIdentity && retries > 0) {
						const currentUser =
							window.netlifyIdentity.currentUser();
						console.log(
							'Checking current user after page refresh:',
							currentUser
						);
						if (currentUser) {
							setUser(currentUser);
							setDisplayName(computeDisplayName(currentUser));
							setLoading(false);
							if (!computeDisplayName(currentUser)) {
								refreshUserWithRetries();
							}
						} else {
							// 继续等待
							setTimeout(() => checkInit(retries - 1), 200);
						}
					} else {
						// 初始化完成但没有用户或超时
						setLoading(false);
						console.log(
							'Netlify Identity init complete, no active user session'
						);
					}
				};
				checkInit();
			}, 300);
		}

		// 持续监控和清理可能出现的阻挡元素
		const intervalCleanup = setInterval(() => {
			if (!widgetOpenRef.current) {
				cleanupOverlays();

				// 额外检查：如果发现任何全屏的固定定位元素，立即隐藏
				const fullscreenElements = document.querySelectorAll(
					'iframe[style*="position: fixed"][style*="width: 100%"][style*="height: 100%"], ' +
						'[style*="position: fixed"][style*="z-index: 99"], ' +
						'[style*="display: block !important"][style*="position: fixed"]'
				);

				fullscreenElements.forEach(el => {
					const htmlEl = el as HTMLElement;
					if (htmlEl && htmlEl.id !== 'netlify-identity-widget') {
						try {
							if (htmlEl.parentElement) {
								htmlEl.parentElement.removeChild(htmlEl);
							}
						} catch (e) {
							console.warn('Removed fullscreen blocking element');
						}
					}
					// 不再干预netlify-identity-widget的样式
				});
			}
		}, 1500);

		const handleGlobalClick = () => {
			if (!widgetOpenRef.current) cleanupOverlays();
		};

		const timer = setTimeout(() => {
			document.addEventListener('click', handleGlobalClick, true);
		}, 2000);

		// 添加 MutationObserver 来实时监控 DOM 变化
		const observer = new MutationObserver(mutations => {
			let shouldCleanup = false;

			mutations.forEach(mutation => {
				// 检查是否有新的元素被添加到DOM中
				mutation.addedNodes.forEach(node => {
					if (node.nodeType === 1) {
						// ELEMENT_NODE
						const element = node as HTMLElement;

						// 检查是否是可能阻挡用户的元素
						if (
							element.tagName === 'IFRAME' ||
							element.style.position === 'fixed' ||
							element.style.zIndex === '99' ||
							element.style.zIndex === '9999' ||
							element.style.display === 'block !important' ||
							element.classList.contains('netlify') ||
							element.id.includes('netlify')
						) {
							shouldCleanup = true;
						}
					}
				});

				// 检查是否有样式变化
				if (
					mutation.type === 'attributes' &&
					mutation.attributeName === 'style'
				) {
					const target = mutation.target as HTMLElement;
					if (
						target.id === 'netlify-identity-widget' ||
						target.style.position === 'fixed' ||
						target.style.zIndex === '99' ||
						target.style.zIndex === '9999'
					) {
						shouldCleanup = true;
					}
				}
			});

			// 如果发现问题元素，立即清理
			if (shouldCleanup && !widgetOpenRef.current) {
				setTimeout(() => cleanupOverlays(), 100);
			}
		});

		// 开始观察
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['style', 'class'],
		});

		return () => {
			if (currentScript && document.head.contains(currentScript)) {
				document.head.removeChild(currentScript);
			}
			clearTimeout(timer);
			clearInterval(intervalCleanup);
			document.removeEventListener('click', handleGlobalClick, true);

			// 断开 MutationObserver
			if (observer) {
				observer.disconnect();
			}

			// 组件卸载时彻底清理所有 iframe
			const allWidgets = document.querySelectorAll(
				'iframe[id="netlify-identity-widget"]'
			);
			allWidgets.forEach(widget => {
				try {
					if (widget.parentElement) {
						widget.parentElement.removeChild(widget);
					}
				} catch (e) {
					console.warn('Failed to remove widget on unmount:', e);
				}
			});

			// 重置全局状态
			scriptLoadedRef.current = false;
			initCompletedRef.current = false;
		};
	}, []);

	const handleLogin = () => {
		if (window.netlifyIdentity) {
			try {
				// 确保只有一个活跃的 iframe
				const widgets = document.querySelectorAll(
					'iframe[id="netlify-identity-widget"]'
				);

				// 如果没有 iframe 或有多个，清理并重新初始化
				if (widgets.length === 0) {
					console.log('No iframe found, reinitializing...');
					if (window.netlifyIdentity.init) {
						window.netlifyIdentity.init();
						setTimeout(() => {
							widgetOpenRef.current = true;
							window.netlifyIdentity.open();
						}, 500);
						return;
					}
				} else if (widgets.length > 1) {
					// 对于多余的iframe，暂时保持不动，让Netlify Identity处理
					// 或者在组件卸载时清理
					console.log(
						`Found ${widgets.length} netlify-identity-widget iframes, keeping all for now`
					);
				}

				// 不要手动设置iframe样式，让Netlify Identity完全管理
				// 只设置状态标记
				widgetOpenRef.current = true;

				// 添加调试信息
				console.log('Opening Netlify Identity widget...');
				window.netlifyIdentity.open();
			} catch (error) {
				console.error('登录失败:', error);
				// 如果出错，重置状态
				widgetOpenRef.current = false;
				console.log('Login failed, you can try again');
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
					maxWidth: '500px',
					margin: '2rem auto',
					padding: '3rem',
					textAlign: 'center',
					background: 'var(--ifm-hero-background-color)',
					borderRadius: '16px',
					border: '2px solid var(--ifm-color-primary)',
					boxShadow: '0 6px 24px rgba(108, 0, 148, 0.15)',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				{/* 装饰性背景元素 */}
				<div
					style={{
						position: 'absolute',
						top: '-50%',
						left: '-50%',
						width: '200%',
						height: '200%',
						background:
							'radial-gradient(circle, rgba(108, 0, 148, 0.03) 0%, transparent 70%)',
						pointerEvents: 'none',
						zIndex: 1,
					}}
				/>

				<div style={{ position: 'relative', zIndex: 2 }}>
					{/* 加载动画 */}
					<div
						style={{
							display: 'inline-block',
							width: '40px',
							height: '40px',
							border: '3px solid rgba(108, 0, 148, 0.2)',
							borderTop: '3px solid var(--ifm-color-primary)',
							borderRadius: '50%',
							animation: 'spin 1s linear infinite',
							marginBottom: '1rem',
						}}
					/>
					<p
						style={{
							fontSize: '1.2rem',
							color: 'var(--ifm-color-primary)',
							fontWeight: '500',
							margin: 0,
						}}
					>
						正在验证访问权限...
					</p>
					<p
						style={{
							fontSize: '0.9rem',
							color: 'var(--ifm-color-baw)',
							opacity: 0.7,
							marginTop: '0.5rem',
						}}
					>
						请稍候
					</p>
				</div>

				{/* 添加加载动画的CSS */}
				<style
					dangerouslySetInnerHTML={{
						__html: `
						@keyframes spin {
							0% { transform: rotate(0deg); }
							100% { transform: rotate(360deg); }
						}
					`,
					}}
				/>
			</div>
		);
	}

	if (error) {
		return (
			<div
				style={{
					maxWidth: '550px',
					margin: '2rem auto',
					padding: '2.5rem',
					border: '2px solid #ff6b6b',
					borderRadius: '16px',
					textAlign: 'center',
					background: 'var(--ifm-hero-background-color)',
					boxShadow: '0 6px 24px rgba(255, 107, 107, 0.2)',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				{/* 装饰性背景元素 */}
				<div
					style={{
						position: 'absolute',
						top: '-30%',
						left: '-30%',
						width: '160%',
						height: '160%',
						background:
							'radial-gradient(circle, rgba(255, 107, 107, 0.08) 0%, transparent 70%)',
						pointerEvents: 'none',
						zIndex: 1,
					}}
				/>

				<div style={{ position: 'relative', zIndex: 2 }}>
					<h2
						style={{
							fontSize: '1.6rem',
							color: '#ff6b6b',
							marginBottom: '1rem',
							fontWeight: 'bold',
						}}
					>
						⚠️ 认证服务不可用
					</h2>
					<p
						style={{
							fontSize: '1rem',
							color: 'var(--ifm-color-baw)',
							marginBottom: '1.5rem',
							lineHeight: '1.5',
						}}
					>
						{error}
					</p>
					<button
						onClick={() => window.location.reload()}
						style={{
							position: 'relative',
							padding: '1em 2em',
							outline: 'none',
							border: '1px solid #ff6b6b',
							background:
								'linear-gradient(135deg, #ff6b6b, #ff8b8b)',
							color: 'white',
							textTransform: 'uppercase',
							letterSpacing: '1px',
							fontSize: '14px',
							overflow: 'hidden',
							transition: 'all 0.3s ease',
							borderRadius: '12px',
							cursor: 'pointer',
							fontWeight: 'bold',
							boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
						}}
					>
						{/* 装饰性span元素 */}
						<span
							style={{
								position: 'absolute',
								top: 0,
								left: '-100%',
								width: '100%',
								height: '2px',
								background:
									'linear-gradient(90deg, transparent, #fff)',
								transition: 'left 0.6s',
							}}
						/>
						<span
							style={{
								position: 'absolute',
								bottom: 0,
								right: '-100%',
								width: '100%',
								height: '2px',
								background:
									'linear-gradient(90deg, transparent, #fff)',
								transition: 'right 0.6s',
								transitionDelay: '0.2s',
							}}
						/>
						重新加载
					</button>

					{/* 添加悬停效果的CSS */}
					<style
						dangerouslySetInnerHTML={{
							__html: `
							button:hover {
								transform: translateY(-2px);
								box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
							}
							button:hover span:nth-child(1) { left: 100%; }
							button:hover span:nth-child(2) { right: 100%; }
							button:active {
								transform: translateY(0);
								box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
							}
						`,
						}}
					/>
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div
				style={{
					maxWidth: '600px',
					margin: '2rem auto',
					padding: '3rem',
					border: '2px solid var(--ifm-color-primary)',
					borderRadius: '20px',
					textAlign: 'center',
					background: 'var(--ifm-hero-background-color)',
					boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				{/* 装饰性背景元素 */}
				<div
					style={{
						position: 'absolute',
						top: '-50%',
						left: '-50%',
						width: '200%',
						height: '200%',
						background:
							'radial-gradient(circle, rgba(108, 0, 148, 0.05) 0%, transparent 70%)',
						pointerEvents: 'none',
						zIndex: 1,
					}}
				/>

				<div style={{ position: 'relative', zIndex: 2 }}>
					<h2
						style={{
							fontSize: '1.8rem',
							color: 'var(--ifm-color-primary)',
							marginBottom: '1rem',
							fontWeight: 'bold',
						}}
					>
						🔒 Game Design 教学内容
					</h2>
					<p
						style={{
							fontSize: '1.1rem',
							color: 'var(--ifm-color-baw)',
							marginBottom: '2rem',
							lineHeight: '1.6',
						}}
					>
						为了保护学生隐私，此内容需要通过 Netlify Identity
						验证身份。
					</p>

					{/* 美化的登录按钮 */}
					<button
						onClick={handleLogin}
						className="auth-login-button"
						style={{
							position: 'relative',
							padding: '1.2em 2.5em',
							outline: 'none',
							border: '1px solid #303030',
							background: 'var(--ifm-botton1-background-color)',
							color: 'rgb(200, 141, 255)',
							textTransform: 'uppercase',
							letterSpacing: '2px',
							fontSize: '16px',
							overflow: 'hidden',
							transition: 'all 0.3s ease',
							borderRadius: '20px',
							cursor: 'pointer',
							fontWeight: 'bold',
							margin: '1.5rem 0',
							boxShadow: '0 4px 15px rgba(108, 0, 148, 0.3)',
						}}
					>
						{/* 装饰性span元素 */}
						<span
							style={{
								position: 'absolute',
								top: 0,
								left: '-100%',
								width: '100%',
								height: '2px',
								background:
									'linear-gradient(90deg, transparent, #ae00ff)',
								transition: 'left 0.7s',
							}}
						/>
						<span
							style={{
								position: 'absolute',
								bottom: 0,
								right: '-100%',
								width: '100%',
								height: '2px',
								background:
									'linear-gradient(90deg, transparent, #001eff)',
								transition: 'right 0.7s',
								transitionDelay: '0.35s',
							}}
						/>
						<span
							style={{
								position: 'absolute',
								top: '-100%',
								right: 0,
								width: '2px',
								height: '100%',
								background:
									'linear-gradient(180deg, transparent, #ae00ff)',
								transition: 'top 0.7s',
								transitionDelay: '0.17s',
							}}
						/>
						<span
							style={{
								position: 'absolute',
								bottom: '-100%',
								left: 0,
								width: '2px',
								height: '100%',
								background:
									'linear-gradient(360deg, transparent, #001eff)',
								transition: 'bottom 0.7s',
								transitionDelay: '0.52s',
							}}
						/>
						登录 / 注册
					</button>

					{/* 添加悬停效果的CSS */}
					<style
						dangerouslySetInnerHTML={{
							__html: `
							.auth-login-button:hover {
								box-shadow: 0 0 20px #ae00ff, 0 0 40px #001eff, 0 0 80px #ae00ff;
								transform: translateY(-2px);
							}
							.auth-login-button:hover span:nth-child(1) { left: 100%; }
							.auth-login-button:hover span:nth-child(2) { right: 100%; }
							.auth-login-button:hover span:nth-child(3) { top: 100%; }
							.auth-login-button:hover span:nth-child(4) { bottom: 100%; }
							.auth-login-button:active {
								background: linear-gradient(to top right, #ae00af, #001eff);
								color: #bfbfbf;
								transform: translateY(0);
							}
						`,
						}}
					/>

					<p
						style={{
							fontSize: '0.95rem',
							color: 'var(--ifm-color-baw)',
							opacity: 0.8,
							marginTop: '1.5rem',
						}}
					>
						如果您是学生，请联系老师将您的邮箱添加到访问列表
					</p>
				</div>
			</div>
		);
	}

	return (
		<div>
			<div
				style={{
					background:
						'linear-gradient(135deg, var(--ifm-color-primary), var(--ifm-color-primary-light))',
					color: 'white',
					padding: '1rem 1.5rem',
					borderRadius: '12px',
					margin: '1rem 0',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					boxShadow: '0 4px 20px rgba(108, 0, 148, 0.3)',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				{/* 装饰性背景元素 */}
				<div
					style={{
						position: 'absolute',
						top: '-50%',
						right: '-20%',
						width: '70%',
						height: '200%',
						background:
							'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
						pointerEvents: 'none',
						zIndex: 1,
					}}
				/>

				<div
					style={{
						position: 'relative',
						zIndex: 2,
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
					}}
				>
					<span style={{ fontSize: '1.2rem' }}>✅</span>
					<span style={{ fontWeight: '500' }}>
						已验证访问 - {displayName || '已登录'}
					</span>
				</div>

				<button
					onClick={handleLogout}
					style={{
						position: 'relative',
						background: 'rgba(255, 255, 255, 0.2)',
						border: '1px solid rgba(255, 255, 255, 0.3)',
						color: 'white',
						padding: '0.5rem 1rem',
						borderRadius: '8px',
						cursor: 'pointer',
						fontSize: '0.9rem',
						fontWeight: '500',
						transition: 'all 0.3s ease',
						backdropFilter: 'blur(10px)',
					}}
					onMouseEnter={e => {
						const target = e.target as HTMLButtonElement;
						target.style.background = 'rgba(255, 255, 255, 0.3)';
						target.style.transform = 'scale(1.05)';
					}}
					onMouseLeave={e => {
						const target = e.target as HTMLButtonElement;
						target.style.background = 'rgba(255, 255, 255, 0.2)';
						target.style.transform = 'scale(1)';
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
