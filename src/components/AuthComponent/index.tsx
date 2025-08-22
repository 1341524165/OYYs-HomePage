import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import AuthButton from '../AuthButton';
import './styles.module.css';

const AuthComponent: React.FC = () => {
    const { user, loading, login, logout } = useAuth();

    if (loading) {
        return <div className="auth-loading">加载中...</div>;
    }

    return (
        <div className="auth-component">
            {user ? (
                <div className="user-info">
                    <span className="welcome-text">
                        欢迎, {user.user_metadata?.full_name || user.email}!
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
                <AuthButton
                    onClick={login}
                    variant="primary"
                    size="medium"
                >
                    登录 / 注册
                </AuthButton>
            )}
        </div>
    );
};

export default AuthComponent;
