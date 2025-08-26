import { useEffect, useState } from 'react';

interface User {
	id: string;
	email: string;
	user_metadata?: {
		full_name?: string;
	};
}

declare global {
	interface Window {
		netlifyIdentity: any;
	}
}

export const useAuth = () => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		// 设置客户端标志
		setIsClient(true);

		let retryCount = 0;
		const maxRetries = 100; // 10秒内重试

		const initializeAuth = () => {
			if (window.netlifyIdentity) {
				try {
					// 检查 Identity 服务是否可用
					if (typeof window.netlifyIdentity.init === 'function') {
						window.netlifyIdentity.init();
						const currentUser =
							window.netlifyIdentity.currentUser();
						// 当前用户数据已加载
						setUser(currentUser);
						setLoading(false);
						setError(null);

						window.netlifyIdentity.on('login', (user: User) => {
							// 用户登录成功
							setUser(user);
							setError(null);
							// 确保模态框完全关闭并清理覆盖层
							setTimeout(() => {
								try {
									window.netlifyIdentity.close();
									// 清理可能存在的覆盖层
									const overlay = document.querySelector(
										'.netlify-identity-overlay'
									);
									if (overlay) {
										overlay.remove();
									}
									const widget = document.querySelector(
										'#netlify-identity-widget'
									);
									if (widget) {
										widget.style.display = 'none';
									}
								} catch (e) {
									// 清理覆盖层失败，忽略错误
								}
							}, 200);
						});

						window.netlifyIdentity.on('logout', () => {
							setUser(null);
							setError(null);
						});

						window.netlifyIdentity.on('error', (err: any) => {
							setError('认证服务暂时不可用，请稍后重试');
						});

						// 模态框关闭事件
						window.netlifyIdentity.on('close', () => {
							// 模态框已关闭
						});

						// 模态框打开事件
						window.netlifyIdentity.on('open', () => {
							// 模态框已打开
						});
					} else {
						throw new Error('Netlify Identity 初始化失败');
					}
				} catch (err) {
					setError('认证服务初始化失败');
					setLoading(false);
				}
			} else if (retryCount < maxRetries) {
				retryCount++;
				setTimeout(initializeAuth, 100);
			} else {
				setLoading(false);
				setError('认证服务加载超时，请刷新页面重试');
			}
		};

		initializeAuth();

		return () => {
			if (window.netlifyIdentity) {
				window.netlifyIdentity.off('login');
				window.netlifyIdentity.off('logout');
				window.netlifyIdentity.off('error');
				window.netlifyIdentity.off('close');
				window.netlifyIdentity.off('open');
			}
		};
	}, []);

	const login = () => {
		if (window.netlifyIdentity && !error) {
			try {
				// 强制关闭可能存在的模态框
				window.netlifyIdentity.close();
				// 短暂延迟后打开新的模态框
				setTimeout(() => {
					window.netlifyIdentity.open();
				}, 200);
			} catch (err) {
				setError('无法打开登录窗口，请刷新页面重试');
			}
		} else if (error) {
			// 如果有错误，刷新页面重试
			window.location.reload();
		}
	};

	const logout = () => {
		if (window.netlifyIdentity) {
			try {
				window.netlifyIdentity.logout();
			} catch (err) {
				setError('登出失败，请刷新页面重试');
			}
		}
	};

	return {
		user,
		loading: loading && isClient, // 只在客户端显示加载状态
		error,
		login,
		logout,
		isAuthenticated: !!user && isClient,
		isClient,
	};
};
