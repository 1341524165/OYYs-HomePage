import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
	{
		title: 'docs/category/daily',
		Svg: require('@site/static/img/com.svg').default,
		description: <>&nbsp;大大生活&nbsp;</>,
	},
	{
		title: 'docs/category/study',
		Svg: require('@site/static/img/data.svg').default,
		description: <>&nbsp;中中学习&nbsp;</>,
	},
	{
		title: 'docs/category/game',
		Svg: require('@site/static/img/save.svg').default,
		description: <>&nbsp;小小网瘾&nbsp;</>,
	},
];

function Feature({ Svg, title, description }) {
	return (
		<div className={clsx('col col--4')}>
			<a href={title}>
				<button className="button1">
					<span></span>
					<span></span>
					<span></span>
					<span></span> &nbsp;{description}&nbsp;
				</button>
				{/* <div className="text--center">
          <Svg className={styles.featureSvg} role="img" />
        </div> */}
			</a>
		</div>
	);
}

export default function HomepageFeatures() {
	return (
		<div
			// style={{ backgroundColor: "var(--ifm-hero-background-color) !important" }}
			className={styles.features}
		>
			<div className="container">
				<div className="row">
					{FeatureList.map((props, idx) => (
						<Feature key={idx} {...props} />
					))}
				</div>
			</div>
		</div>
	);
}
