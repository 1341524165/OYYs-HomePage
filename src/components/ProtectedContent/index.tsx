import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import './styles.module.css';

interface ProtectedContentProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

const ProtectedContent: React.FC<ProtectedContentProps> = ({
    children,
    fallback
}) => {
    const { user, loading, login } = useAuth();

    if (loading) {
        return <div className="protected-loading">加载中...</div>;
    }

    if (!user) {
        return (
            <div className="protected-fallback">
                {fallback || (
                    <div className="login-prompt">
                        <h3>需要登录</h3>
                        <p>请先登录以查看此内容。</p>
                        <button
                            className="login-button"
                            onClick={login}
                        >
                            立即登录
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return <div className="protected-content">{children}</div>;
};

export default ProtectedContent;
