import React, { useEffect } from 'react';

export default function Root({ children }) {
    useEffect(() => {
        // 动态加载Netlify Identity脚本
        const script = document.createElement('script');
        script.src = 'https://identity.netlify.com/v1/netlify-identity-widget.js';
        script.async = true;
        script.onload = () => {
            console.log('Netlify Identity 脚本加载完成');
        };
        document.head.appendChild(script);

        return () => {
            // 清理脚本
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    return <>{children}</>;
}
