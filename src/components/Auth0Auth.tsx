import { useAuth0 } from '@auth0/auth0-react';
import React from 'react';

const Auth0Auth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { isLoading, isAuthenticated, user, loginWithRedirect, logout } =
		useAuth0();

	// 检查是否是保护路径
	const isProtectedPath = () => {
		if (typeof window === 'undefined') return false;
		const path = window.location.pathname.toLowerCase();
		return path.includes('/docs/study/vg-teaching');
	};

	// 检查Auth0是否正确配置
	const isAuth0Configured = () => {
		if (typeof window === 'undefined') return false;

		const isLocalhost =
			window.location.hostname === 'localhost' ||
			window.location.hostname === '127.0.0.1';
		if (isLocalhost) return false;

		// Auth0 is configured in Root.tsx with actual values
		// We'll consider it configured if we're not on localhost
		return true;
	};

	// 美化的包裹框组件
	const AuthContainer: React.FC<{
		children: React.ReactNode;
		variant?: 'default' | 'error' | 'success';
		className?: string;
	}> = ({ children, variant = 'default', className = '' }) => {
		const getVariantStyles = () => {
			switch (variant) {
				case 'error':
					return {
						borderColor: '#ff6b6b',
						boxShadowColor: 'rgba(255, 107, 107, 0.2)',
						backgroundGradient:
							'radial-gradient(circle, rgba(255, 107, 107, 0.05) 0%, transparent 70%)',
					};
				case 'success':
					return {
						borderColor: 'var(--ifm-color-primary-lighter)',
						boxShadowColor: 'rgba(124, 0, 170, 0.2)',
						backgroundGradient:
							'radial-gradient(circle, rgba(108, 0, 148, 0.05) 0%, transparent 70%)',
					};
				default:
					return {
						borderColor: 'var(--ifm-color-primary-lighter)',
						boxShadowColor: 'rgba(124, 0, 170, 0.15)',
						backgroundGradient:
							'radial-gradient(circle, rgba(108, 0, 148, 0.03) 0%, transparent 70%)',
					};
			}
		};

		const variantStyles = getVariantStyles();

		return (
			<div
				className={`auth-container ${className}`}
				style={{
					maxWidth: '650px',
					margin: '2rem auto',
					padding: '2.5rem',
					background: 'var(--ifm-hero-background-color)',
					border: `2px solid ${variantStyles.borderColor}`,
					borderRadius: '24px',
					boxShadow: `0 4px 20px ${variantStyles.boxShadowColor}`,
					position: 'relative',
					overflow: 'hidden',
					transition: 'all 0.3s ease',
				}}
			>
				{/* 装饰性背景渐变 */}
				<div
					style={{
						position: 'absolute',
						top: '-60%',
						left: '-60%',
						width: '220%',
						height: '220%',
						background: variantStyles.backgroundGradient,
						pointerEvents: 'none',
						zIndex: 1,
						animation: 'gentle-float 20s ease-in-out infinite',
					}}
				/>

				{/* 装饰性几何图形 */}
				<div
					style={{
						position: 'absolute',
						top: '20px',
						right: '20px',
						width: '50px',
						height: '50px',
						background: `conic-gradient(from 0deg, ${variantStyles.borderColor}, transparent, ${variantStyles.borderColor})`,
						borderRadius: '50%',
						opacity: 0.06,
						animation: 'rotate-slow 20s linear infinite',
						zIndex: 1,
					}}
				/>

				<div
					style={{
						position: 'absolute',
						bottom: '20px',
						left: '20px',
						width: '35px',
						height: '35px',
						background: `linear-gradient(45deg, ${variantStyles.borderColor}, transparent)`,
						opacity: 0.06,
						animation: 'pulse-gentle 6s ease-in-out infinite',
						zIndex: 1,
					}}
				/>

				{/* 内容区域 */}
				<div
					style={{
						position: 'relative',
						zIndex: 2,
						width: '100%',
						height: '100%',
					}}
				>
					{children}
				</div>

				{/* 全局CSS样式 */}
				<style
					dangerouslySetInnerHTML={{
						__html: `
              @keyframes gentle-float {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                25% { transform: translate(10px, -10px) rotate(1deg); }
                50% { transform: translate(-5px, 5px) rotate(-1deg); }
                75% { transform: translate(-10px, -5px) rotate(0.5deg); }
              }
              @keyframes rotate-slow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes pulse-gentle {
                0%, 100% { opacity: 0.1; transform: scale(1); }
                50% { opacity: 0.2; transform: scale(1.1); }
              }
              .auth-container:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 24px ${variantStyles.boxShadowColor};
              }
            `,
					}}
				/>
			</div>
		);
	};

	// 不需要保护的路径直接返回内容
	if (!isProtectedPath()) {
		return <>{children}</>;
	}

	// 如果Auth0没有正确配置，显示配置提示
	if (!isAuth0Configured()) {
		return (
			<AuthContainer variant="error">
				<div style={{ textAlign: 'center' }}>
					<h2
						style={{
							fontSize: '1.8rem',
							color: '#ff6b6b',
							marginBottom: '1rem',
							fontWeight: 'bold',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '0.5rem',
						}}
					>
						<span style={{ fontSize: '1.5rem' }}>⚠️</span>
						认证服务未配置
					</h2>
					<p
						style={{
							fontSize: '1.1rem',
							color: 'var(--ifm-color-baw)',
							marginBottom: '2rem',
							lineHeight: '1.6',
							background: 'rgba(255, 107, 107, 0.1)',
							padding: '1rem',
							borderRadius: '8px',
							border: '1px solid rgba(255, 107, 107, 0.2)',
						}}
					>
						Auth0 认证服务尚未正确配置。请联系管理员完成以下步骤：
						<br />
						<br />
						1. 在 Netlify 中设置环境变量：AUTH0_DOMAIN 和
						AUTH0_CLIENT_ID
						<br />
						2. 在 Auth0 Dashboard 中配置应用和身份提供商
						<br />
						3. 确保回调 URL 设置正确
					</p>
				</div>
			</AuthContainer>
		);
	}

	// 加载中显示等待界面
	if (isLoading) {
		return (
			<AuthContainer>
				<div style={{ textAlign: 'center' }}>
					{/* 加载动画 */}
					<div
						style={{
							display: 'inline-block',
							width: '50px',
							height: '50px',
							border: '4px solid rgba(108, 0, 148, 0.2)',
							borderTop: '4px solid var(--ifm-color-primary)',
							borderRadius: '50%',
							animation: 'spin 1s linear infinite',
							marginBottom: '1.5rem',
						}}
					/>
					<h3
						style={{
							fontSize: '1.4rem',
							color: 'var(--ifm-color-primary)',
							fontWeight: '600',
							margin: '0 0 0.5rem 0',
						}}
					>
						正在验证访问权限
					</h3>
					<p
						style={{
							fontSize: '1rem',
							color: 'var(--ifm-color-baw)',
							opacity: 0.8,
							margin: 0,
						}}
					>
						请稍候，正在检查您的访问权限...
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
			</AuthContainer>
		);
	}

	// 未登录显示登录界面
	if (!isAuthenticated) {
		return (
			<AuthContainer variant="default" className="auth-login-container">
				<div style={{ textAlign: 'center' }}>
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
						为了保护学生隐私，此内容需要通过 Auth0 验证身份。 支持
						用户名密码、Google、GitHub 等多种登录方式。
					</p>

					{/* 美化的登录按钮 */}
					<button
						onClick={() =>
							loginWithRedirect({
								appState: {
									returnTo: window.location.pathname,
								},
							})
						}
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
                  box-shadow: 0 0 15px rgba(174, 0, 255, 0.4), 0 0 25px rgba(0, 30, 255, 0.3);
                  transform: translateY(-1px);
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
			</AuthContainer>
		);
	}

	// 已登录显示用户信息和内容
	return (
		<div>
			{/* 已登录状态的美化容器 */}
			<div
				style={{
					background:
						'linear-gradient(225deg, var(--ifm-color-primary-darkest), var(--ifm-color-primary-lightest))',
					color: 'white',
					padding: '1rem 1.5rem',
					borderRadius: '16px',
					margin: '1rem 0',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					boxShadow: '0 4px 16px rgba(108, 0, 148, 0.25)',
					position: 'relative',
					overflow: 'hidden',
					transition: 'all 0.3s ease',
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
							'radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, transparent 70%)',
						pointerEvents: 'none',
						zIndex: 1,
						animation: 'gentle-float 15s ease-in-out infinite',
					}}
				/>

				{/* 装饰性几何图形 */}
				<div
					style={{
						position: 'absolute',
						bottom: '10px',
						left: '20px',
						width: '30px',
						height: '30px',
						background: 'rgba(255, 255, 255, 0.05)',
						borderRadius: '50%',
						animation: 'pulse-gentle 3s ease-in-out infinite',
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
					<span
						style={{
							fontSize: '1.4rem',
							animation: 'bounce-in 0.6s ease-out',
						}}
					>
						✅
					</span>
					<span style={{ fontWeight: '600', fontSize: '1rem' }}>
						已验证访问 - {user?.name || user?.email}
					</span>
				</div>

				<button
					onClick={() => logout()}
					style={{
						position: 'relative',
						background: 'rgba(255, 255, 255, 0.2)',
						border: '1px solid rgba(255, 255, 255, 0.3)',
						color: 'white',
						padding: '0.6rem 1.2rem',
						borderRadius: '10px',
						cursor: 'pointer',
						fontSize: '0.9rem',
						fontWeight: '600',
						transition: 'all 0.3s ease',
						backdropFilter: 'blur(10px)',
						boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
					}}
					onMouseEnter={e => {
						const target = e.target as HTMLButtonElement;
						target.style.background = 'rgba(255, 255, 255, 0.3)';
						target.style.transform = 'scale(1.05)';
						target.style.boxShadow =
							'0 4px 15px rgba(0, 0, 0, 0.2)';
					}}
					onMouseLeave={e => {
						const target = e.target as HTMLButtonElement;
						target.style.background = 'rgba(255, 255, 255, 0.2)';
						target.style.transform = 'scale(1)';
						target.style.boxShadow =
							'0 2px 10px rgba(0, 0, 0, 0.1)';
					}}
				>
					登出
				</button>

				{/* 添加成功状态的动画CSS */}
				<style
					dangerouslySetInnerHTML={{
						__html: `
              @keyframes bounce-in {
                0% { transform: scale(0); opacity: 0; }
                50% { transform: scale(1.2); opacity: 0.8; }
                100% { transform: scale(1); opacity: 1; }
              }
              @keyframes gentle-float {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                25% { transform: translate(5px, -5px) rotate(0.5deg); }
                50% { transform: translate(-3px, 3px) rotate(-0.5deg); }
                75% { transform: translate(3px, -3px) rotate(0.25deg); }
              }
              @keyframes pulse-gentle {
                0%, 100% { opacity: 0.1; transform: scale(1); }
                50% { opacity: 0.2; transform: scale(1.05); }
              }
            `,
					}}
				/>
			</div>
			{children}
		</div>
	);
};

export default Auth0Auth;
