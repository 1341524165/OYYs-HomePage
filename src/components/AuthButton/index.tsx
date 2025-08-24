import React from 'react';
import styles from './styles.module.css';

interface AuthButtonProps {
	onClick: () => void;
	children: React.ReactNode;
	variant?: 'primary' | 'secondary';
	size?: 'small' | 'medium' | 'large';
	className?: string;
}

const AuthButton: React.FC<AuthButtonProps> = ({
	onClick,
	children,
	variant = 'primary',
	size = 'medium',
	className = '',
}) => {
	const baseClass = styles.authBtn;
	const variantClass =
		styles[`authBtn${variant.charAt(0).toUpperCase() + variant.slice(1)}`];
	const sizeClass =
		styles[`authBtn${size.charAt(0).toUpperCase() + size.slice(1)}`];

	return (
		<button
			className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
			onClick={onClick}
		>
			<span className={styles.authBtnContent}>{children}</span>
			<div className={styles.authBtnGlow}></div>
		</button>
	);
};

export default AuthButton;
