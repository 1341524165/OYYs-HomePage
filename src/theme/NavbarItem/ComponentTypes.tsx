import React from 'react';
import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import AuthComponent from '../../components/AuthComponent';

export default {
    ...ComponentTypes,
    'custom-authComponent': () => <AuthComponent />,
};
