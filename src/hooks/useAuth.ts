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

    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 100; // 10秒内重试

        const initializeAuth = () => {
            if (window.netlifyIdentity) {
                try {
                    // 检查 Identity 服务是否可用
                    if (typeof window.netlifyIdentity.init === 'function') {
                        window.netlifyIdentity.init();
                        const currentUser = window.netlifyIdentity.currentUser();
                        setUser(currentUser);
                        setLoading(false);
                        setError(null);

                        window.netlifyIdentity.on('login', (user: User) => {
                            setUser(user);
                            setError(null);
                            window.netlifyIdentity.close();
                        });

                        window.netlifyIdentity.on('logout', () => {
                            setUser(null);
                            setError(null);
                        });

                        window.netlifyIdentity.on('error', (err: any) => {
                            setError('认证服务暂时不可用，请稍后重试');
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
            }
        };
    }, []);

    const login = () => {
        if (window.netlifyIdentity && !error) {
            try {
                window.netlifyIdentity.open();
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
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user
    };
};
