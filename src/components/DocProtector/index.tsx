import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import './styles.module.css';

interface DocProtectorProps {
    children: React.ReactNode;
    protectedPaths?: string[];
    currentPath?: string;
}

const DocProtector: React.FC<DocProtectorProps> = ({
    children,
    protectedPaths = ['/docs/study/vg-teaching'],
    currentPath
}) => {
    const { user, loading, login } = useAuth();

    // 检查当前路径是否需要保护
    const isProtectedPath = () => {
        let pathname = '';

        if (!currentPath && typeof window !== 'undefined') {
            pathname = window.location.pathname;
        } else if (currentPath) {
            pathname = currentPath;
        } else {
            return false;
        }

        // URL解码并转换为小写进行比较
        const decodedPath = decodeURIComponent(pathname).toLowerCase();

        // 调试信息（生产环境可删除）
        console.log('DocProtector Debug:', {
            originalPath: pathname,
            decodedPath: decodedPath,
            protectedPaths: protectedPaths
        });

        const isProtected = protectedPaths.some(path => {
            const normalizedProtectedPath = path.toLowerCase();
            const matches = decodedPath.startsWith(normalizedProtectedPath);
            console.log(`Path check: "${decodedPath}" starts with "${normalizedProtectedPath}"? ${matches}`);
            return matches;
        });

        console.log('Final protection result:', isProtected);
        return isProtected;
    };

    // 如果不是受保护的路径，直接显示内容
    if (!isProtectedPath()) {
        return <>{children}</>;
    }

    // 加载中状态
    if (loading) {
        return (
            <div className="doc-protector-loading">
                <div className="loading-spinner"></div>
                <p>正在验证访问权限...</p>
            </div>
        );
    }

    // 未登录状态
    if (!user) {
        return (
            <div className="doc-protector-container">
                <div className="access-denied">
                    <div className="lock-icon">🔒</div>
                    <h2>VG教学内容需要登录访问</h2>
                    <p>
                        这是视频游戏开发教学的专属内容，包含：
                    </p>
                    <ul className="features-list">
                        <li>🎮 Unity游戏开发教程</li>
                        <li>📚 完整的课程大纲</li>
                        <li>💻 实践项目代码</li>
                        <li>🎯 作业和练习</li>
                    </ul>
                    <button
                        className="access-button"
                        onClick={login}
                    >
                        登录访问教学内容
                    </button>
                    <p className="help-text">
                        如果您是学生，请联系老师获取访问权限
                    </p>
                </div>
            </div>
        );
    }

    // 已登录，显示受保护的内容
    return (
        <div className="doc-protector-content">
            <div className="user-badge">
                <span className="user-info">
                    👤 {user.user_metadata?.full_name || user.email}
                </span>
                <span className="access-status">已验证访问</span>
            </div>
            {children}
        </div>
    );
};

export default DocProtector;
