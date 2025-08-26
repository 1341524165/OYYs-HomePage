import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import AuthButton from '../AuthButton';
import './styles.module.css';

const AuthComponent: React.FC = () => {
	const { user, loading, error, login, logout, isClient } = useAuth();

	// 服务器端渲染时不显示任何内容，避免水合错误
	if (!isClient) {
		return null;
	}

	if (loading) {
		return <div className="auth-loading">加载中...</div>;
	}

	if (error) {
		return (
			<div className="auth-error">
				<AuthButton onClick={login} variant="secondary" size="small">
					重试
				</AuthButton>
			</div>
		);
	}

	return (
		<div className="auth-component">
			{user ? (
				<div className="user-info">
					<span className="welcome-text">
						欢迎,{' '}
						{user?.user_metadata?.full_name ||
							user?.email ||
							user?.id ||
							'已登录'}
						!
					</span>
					<AuthButton
						onClick={logout}
						variant="secondary"
						size="small"
					>
						登出
					</AuthButton>
				</div>
			) : (
				<AuthButton onClick={login} variant="primary" size="medium">
					登录 / 注册
				</AuthButton>
			)}
		</div>
	);
};

export default AuthComponent;
