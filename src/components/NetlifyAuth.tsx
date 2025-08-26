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

			// 如果有多个 iframe，删除多余的
			if (widgets.length > 1) {
				for (let i = 0; i < widgets.length - 1; i++) {
					try {
						const widget = widgets[i];
						if (widget && widget.parentElement) {
							widget.parentElement.removeChild(widget);
						}
					} catch (e) {
						console.warn('Failed to remove duplicate iframe:', e);
					}
				}
			}

			// 确保唯一的 iframe 处于正确状态
			const remainingWidget = document.querySelector(
				'iframe[id="netlify-identity-widget"]'
			) as HTMLElement;
			if (remainingWidget && !widgetOpenRef.current) {
				remainingWidget.style.display = 'none';
				remainingWidget.style.pointerEvents = 'none';
				remainingWidget.style.zIndex = '-9999';
				remainingWidget.style.visibility = 'hidden';
			}
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

			// 特别处理空的或阻挡性的 netlify-identity-widget iframe
			const netlifyWidgets = document.querySelectorAll(
				'iframe[id="netlify-identity-widget"]'
			);
			netlifyWidgets.forEach(widget => {
				const htmlWidget = widget as HTMLIFrameElement;
				try {
					// 检查iframe是否为空或有阻挡性样式
					const widgetStyle = window.getComputedStyle(htmlWidget);
					const isBlocking =
						widgetStyle.display === 'block' &&
						widgetStyle.position === 'fixed' &&
						(widgetStyle.zIndex === '99' ||
							widgetStyle.zIndex === '9999') &&
						widgetStyle.width === '100%' &&
						widgetStyle.height === '100%';

					if (isBlocking && !widgetOpenRef.current) {
						// 如果是阻挡性的，强制隐藏
						htmlWidget.style.display = 'none !important';
						htmlWidget.style.pointerEvents = 'none';
						htmlWidget.style.zIndex = '-9999';
						htmlWidget.style.visibility = 'hidden';
					}
				} catch (e) {
					console.warn('Error processing netlify widget:', e);
				}
			});

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

						// 立即且强制清理所有可能阻挡的元素
						const forceCleanup = () => {
							try {
								// 强制关闭 Netlify Identity modal
								if (
									window.netlifyIdentity &&
									window.netlifyIdentity.close
								) {
									window.netlifyIdentity.close();
								}

								// 清理所有可能阻挡的元素
								cleanupOverlays();

								// 特别处理 netlify-identity-widget iframe
								const widgets = document.querySelectorAll(
									'iframe[id="netlify-identity-widget"]'
								);

								// 保留最后一个widget，删除其他的
								for (let i = 0; i < widgets.length - 1; i++) {
									try {
										const widget = widgets[i];
										if (widget && widget.parentElement) {
											widget.parentElement.removeChild(
												widget
											);
										}
									} catch (e) {
										console.warn(
											'Failed to remove widget:',
											e
										);
									}
								}

								// 隐藏最后一个（保留的）widget
								const lastWidget = widgets[
									widgets.length - 1
								] as HTMLElement;
								if (lastWidget) {
									lastWidget.style.display =
										'none !important';
									lastWidget.style.pointerEvents = 'none';
									lastWidget.style.zIndex = '-9999';
									lastWidget.style.visibility = 'hidden';
								}

								// 清理其他可能的 modal/overlay 元素
								const overlays = document.querySelectorAll(
									'[class*="netlify"], [id*="netlify"], ' +
										'[style*="position: fixed"][style*="z-index"]:not([id="netlify-identity-widget"])'
								);

								overlays.forEach(overlay => {
									try {
										const htmlOverlay =
											overlay as HTMLElement;
										if (
											htmlOverlay &&
											htmlOverlay.parentElement
										) {
											htmlOverlay.parentElement.removeChild(
												htmlOverlay
											);
										}
									} catch (e) {
										console.warn(
											'Failed to remove overlay:',
											e
										);
									}
								});

								// 重置所有可能被修改的样式
								document.body.style.overflow = '';
								document.body.style.pointerEvents = '';
								document.documentElement.style.overflow = '';
								document.documentElement.style.pointerEvents =
									'';

								// 移除任何可能存在的 modal 类
								document.body.classList.remove(
									'netlify-identity-open'
								);
								document.documentElement.classList.remove(
									'netlify-identity-open'
								);
							} catch (e) {
								console.warn('Error during force cleanup:', e);
							}
						};

						// 立即执行清理
						forceCleanup();

						// 延迟再次清理，确保 Netlify Identity 有时间处理
						setTimeout(forceCleanup, 100);
						setTimeout(forceCleanup, 300);
						setTimeout(forceCleanup, 500);
					});

					window.netlifyIdentity.on('logout', () => {
						setUser(null);
						setDisplayName('');
						setError('');
						widgetOpenRef.current = false;
						cleanupDuplicateIframes();
						cleanupOverlays();
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
		} else if (existingScript && !initCompletedRef.current) {
			// 脚本存在但还没初始化，等待初始化完成
			const checkInit = () => {
				if (window.netlifyIdentity) {
					const currentUser = window.netlifyIdentity.currentUser();
					setUser(currentUser);
					setDisplayName(computeDisplayName(currentUser));
					setLoading(false);
				} else {
					setTimeout(checkInit, 100);
				}
			};
			setTimeout(checkInit, 100);
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
					} else if (
						htmlEl &&
						htmlEl.id === 'netlify-identity-widget'
					) {
						// 如果是我们的widget，确保它被隐藏
						htmlEl.style.display = 'none !important';
						htmlEl.style.pointerEvents = 'none';
						htmlEl.style.zIndex = '-9999';
						htmlEl.style.visibility = 'hidden';
					}
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
					// 清理多余的 iframe
					for (let i = 0; i < widgets.length - 1; i++) {
						try {
							const widget = widgets[i];
							if (widget && widget.parentElement) {
								widget.parentElement.removeChild(widget);
							}
						} catch (e) {
							console.warn(
								'Failed to remove duplicate iframe:',
								e
							);
						}
					}
				}

				// 重置唯一 iframe 的样式，让 Netlify Identity 重新控制
				const widget = document.querySelector(
					'iframe[id="netlify-identity-widget"]'
				) as HTMLElement | null;
				if (widget) {
					widget.style.display = 'none';
					widget.style.pointerEvents = 'none';
					widget.style.zIndex = '-9999';
					widget.style.visibility = 'hidden';
				}

				widgetOpenRef.current = true;

				window.netlifyIdentity.open();
			} catch (error) {
				console.error('登录失败:', error);
				// 如果出错，重置状态
				widgetOpenRef.current = false;

				// 尝试重新初始化和打开
				if (window.netlifyIdentity.init) {
					window.netlifyIdentity.init();
					window.netlifyIdentity.open();
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
