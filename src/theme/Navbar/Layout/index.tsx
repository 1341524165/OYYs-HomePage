import React from 'react';
import NavbarLayout from '@theme-original/Navbar/Layout';
import AuthComponent from '../../../components/AuthComponent';

export default function NavbarLayoutWrapper(props) {
    return (
        <div style={{ position: 'relative' }}>
            <NavbarLayout {...props} />
            <div style={{
                position: 'absolute',
                top: '50%',
                right: '20px',
                transform: 'translateY(-50%)',
                zIndex: 1000
            }}>
                <AuthComponent />
            </div>
        </div>
    );
}
