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

    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 50; // 5秒内重试

        const initializeAuth = () => {
            if (window.netlifyIdentity) {
                // 初始化
                window.netlifyIdentity.init();

                // 获取当前用户
                const currentUser = window.netlifyIdentity.currentUser();
                setUser(currentUser);
                setLoading(false);

                // 监听事件
                window.netlifyIdentity.on('login', (user: User) => {
                    setUser(user);
                    window.netlifyIdentity.close();
                });

                window.netlifyIdentity.on('logout', () => {
                    setUser(null);
                });

            } else if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(initializeAuth, 100);
            } else {
                // 超时后停止加载状态
                setLoading(false);
                console.warn('Netlify Identity 加载超时');
            }
        };

        initializeAuth();

        // 清理函数
        return () => {
            if (window.netlifyIdentity) {
                window.netlifyIdentity.off('login');
                window.netlifyIdentity.off('logout');
            }
        };
    }, []);

    const login = () => {
        if (window.netlifyIdentity) {
            window.netlifyIdentity.open();
        }
    };

    const logout = () => {
        if (window.netlifyIdentity) {
            window.netlifyIdentity.logout();
        }
    };

    return {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user
    };
};
