import React from 'react';
import { useAuth } from '../../hooks/useAuth';
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
                    <button
                        className="auth-button logout-button"
                        onClick={logout}
                    >
                        登出
                    </button>
                </div>
            ) : (
                <button
                    className="auth-button login-button"
                    onClick={login}
                >
                    登录 / 注册
                </button>
            )}
        </div>
    );
};

export default AuthComponent;
