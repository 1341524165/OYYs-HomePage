import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import AuthButton from '../AuthButton';
import './styles.module.css';

interface DocProtectorProps {
	children: React.ReactNode;
	protectedPaths?: string[];
	currentPath?: string;
}

const DocProtector: React.FC<DocProtectorProps> = ({
	children,
	protectedPaths = ['/docs/study/vg-teaching'],
	currentPath,
}) => {
	const { user, loading, error, login, isClient } = useAuth();

	// 是否受保护路径（SSR 时无法判断，尽量基于 pathname 推断）
	const isProtectedPath = () => {
		let pathname = '';
		if (!currentPath && typeof window !== 'undefined') {
			pathname = window.location.pathname;
		} else if (currentPath) {
			pathname = currentPath;
		} else {
			return false;
		}
		const decodedPath = decodeURIComponent(pathname).toLowerCase();
		return protectedPaths.some(path =>
			decodedPath.startsWith(path.toLowerCase())
		);
	};

	const pathProtected = isProtectedPath();
	const shouldShowOverlay =
		pathProtected && isClient && (loading || !!error || !user);

	return (
		<div className="doc-protector-wrapper">
			{/* 叠加层：仅在受保护路径且未通过验证/加载/出错时可见 */}
			<div
				className={
					'doc-protector-overlay ' +
					(shouldShowOverlay ? 'overlay-visible' : 'overlay-hidden')
				}
				role="dialog"
				aria-hidden={!shouldShowOverlay}
			>
				{pathProtected && (
					<>
						{loading && (
							<div className="doc-protector-loading">
								<div className="loading-spinner"></div>
								<p>正在验证访问权限...</p>
							</div>
						)}
						{!loading && error && (
							<div className="access-denied">
								<div className="lock-icon">⚠️</div>
								<h2>认证服务暂时不可用</h2>
								<p>{error}</p>
								<div style={{ margin: '25px 0' }}>
									<AuthButton
										onClick={login}
										variant="primary"
										size="medium"
									>
										重试连接
									</AuthButton>
								</div>
								<p className="help-text">
									如果问题持续存在，请检查网络连接或稍后重试
								</p>
							</div>
						)}
						{!loading && !error && !user && (
							<div className="access-denied">
								<div className="lock-icon">🔒</div>
								<h2>Game Design 教学内容需要登录访问</h2>
								<p>
									为了保护学生隐私，当然也是为了限制本博客访问流量..
								</p>
								<div style={{ margin: '25px 0' }}>
									<AuthButton
										onClick={login}
										variant="primary"
										size="medium"
									>
										请登录访问教学内容
									</AuthButton>
								</div>
								<p className="help-text">
									如果您是学生，请联系老师获取访问权限
								</p>
							</div>
						)}
					</>
				)}
			</div>

			{/* 内容始终渲染，避免 SSR/CSR 结构不一致 */}
			<div
				aria-hidden={shouldShowOverlay}
				className="doc-protector-content"
			>
				{pathProtected && user && (
					<div className="user-badge">
						<span className="user-info">
							👤{' '}
							{user?.user_metadata?.full_name ||
								user?.email ||
								user?.id ||
								'已验证用户'}
						</span>
						<span className="access-status">已验证访问</span>
					</div>
				)}
				{children}
			</div>
		</div>
	);
};

export default DocProtector;
