import React, { Suspense } from 'react';

import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
const LazyThreeJSAnimationShader = React.lazy(
	() => import('../three/ThreeJSAnimationShader')
);
import styles from './index.module.css';
import BrowserOnly from '@docusaurus/BrowserOnly';
function HomepageHeader() {
	const { siteConfig } = useDocusaurusContext();

	return (
		<header className={clsx('hero', styles.heroBanner)}>
			<ThreeModel />
			<div className="container">
				{/* <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p> */}
				<div class="container_indextitle">
					<svg className="svg_indextitle" viewBox="0 0 960 300">
						<symbol id="s-text">
							<text text-anchor="middle" x="50%" y="80%">
								OYY's Blog
							</text>
						</symbol>

						<g class="g-ants">
							<use xlinkHref="#s-text" class="text-copy"></use>
							<use xlinkHref="#s-text" class="text-copy"></use>
							<use xlinkHref="#s-text" class="text-copy"></use>
							<use xlinkHref="#s-text" class="text-copy"></use>
							<use xlinkHref="#s-text" class="text-copy"></use>
						</g>
					</svg>
				</div>
				<a href="/docs/intro">
					<button className="button2">&nbsp;Entrance&nbsp;</button>
				</a>
			</div>
		</header>
	);
}

function ThreeModel() {
	const fallback = (
		<canvas
			style={{
				height: '100px',
				width: '100%',
				maxHeight: '100px',
				position: 'relative',
				top: 0,
				zIndex: -100,
			}}
		/>
	);

	return (
		<div className={styles.Three}>
			<BrowserOnly fallback={fallback}>
				{() => (
					<Suspense fallback={fallback}>
						<LazyThreeJSAnimationShader />
					</Suspense>
				)}
			</BrowserOnly>
		</div>
	);
}

export default function Home() {
	const { siteConfig } = useDocusaurusContext();

	return (
		<Layout
			// title={`${siteConfig.title}`}
			description="Description will go into a meta tag in <head />"
		>
			<HomepageHeader />
			<main>
				<HomepageFeatures />
			</main>
		</Layout>
	);
}
