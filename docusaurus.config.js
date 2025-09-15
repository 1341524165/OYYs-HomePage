// @ts-nocheck
// Note: type annotations allow type checking and IDEs autocompletion
const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
module.exports = async function createConfigAsync() {
	const remarkMath = (await import('remark-math')).default;
	const rehypeKatex = (await import('rehype-katex')).default;

	return {
		title: "OYY's Blog",
		tagline: 'Me the man handsome so much',
		url: 'https://your-docusaurus-test-site.com',
		baseUrl: '/',
		onBrokenLinks: 'throw',
		onBrokenMarkdownLinks: 'warn',
		favicon:
			'https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/site%20logo.jpg',

		// GitHub pages deployment config.
		// If you aren't using GitHub pages, you don't need these.
		organizationName: 'facebook', // Usually your GitHub org/user name.
		projectName: 'docusaurus', // Usually your repo name.

		// Even if you don't use internalization, you can use this field to set useful
		// metadata like html lang. For example, if your site is Chinese, you may want
		// to replace "en" with "zh-Hans".
		i18n: {
			defaultLocale: 'en',
			locales: ['en'],
		},

		presets: [
			[
				'classic',
				/** @type {import('@docusaurus/preset-classic').Options} */
				{
					docs: {
						sidebarPath: require.resolve('./sidebars.js'),
						// Please change this to your repo.
						// Remove this to remove the "edit this page" links.
						editUrl:
							'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',

						remarkPlugins: [remarkMath],
						rehypePlugins: [rehypeKatex],
					},
					blog: {
						showReadingTime: true,
						// Please change this to your repo.
						// Remove this to remove the "edit this page" links.
						editUrl:
							'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
						blogSidebarTitle: 'All posts',
						blogSidebarCount: 'ALL',
						sortPosts: 'ascending',
					},
					theme: {
						customCss: require.resolve('./src/css/custom.css'),
					},
				},
			],
		],

		stylesheets: [
			{
				href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
				type: 'text/css',
				integrity:
					'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
				crossorigin: 'anonymous',
			},
		],

		themes: [
			// ... Your other themes.
			[
				require.resolve('@easyops-cn/docusaurus-search-local'),
				{
					// ... Your options.
					// `hashed` is recommended as long-term-cache of index file is possible.
					hashed: true,
					// For Docs using Chinese, The `language` is recommended to set to:
					// ```
					// language: ["en", "zh"],
					// ```
				},
			],
		],

		plugins: [
			[
				'@docusaurus/plugin-content-blog',
				{
					/**
					 * 多实例插件必填。
					 */
					id: 'second-blog',
					/**
					 * 你的网站上博客的 URL 路由。
					 * !!请务必不要 添加末尾斜杠。
					 */
					routeBasePath: 'my-second-blog',
					/**
					 * 相对于站点目录的文件系统路径。
					 */
					path: './my-second-blog',
				},
			],
		],

		themeConfig:
			/** @type {import('@docusaurus/preset-classic').ThemeConfig} */
			{
				navbar: {
					title: 'OYY',
					logo: {
						alt: 'My Site Logo',
						src: 'https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/site%20logo.jpg',
					},
					items: [
						{
							type: 'doc',
							docId: 'intro',
							position: 'left',
							label: '文档',
						},
						{
							to: '/blog/first-blog',
							label: '博客',
							position: 'left',
						},

						{
							href: 'https://github.com/1341524165?tab=repositories',
							label: 'GitHub',
							position: 'right',
						},
					],
				},
				footer: {
					style: 'light',
					links: [
						{
							title: '页内寻址',
							items: [
								{
									label: '文档',
									to: '/docs/intro',
								},
								{
									label: '博客',
									to: '/blog',
								},
							],
						},
						{
							title: 'Cancan word?',
							items: [
								{
									label: 'Bilibili',
									href: 'https://space.bilibili.com/678805690?spm_id_from=333.1007.0.0',
								},
								{
									label: 'Tiktok',
									href: 'https://www.douyin.com/user/MS4wLjABAAAA5Et9C0ibEj8klfJ5aMzsjqLtz2GbiIMvPJJhovVYiVg',
								},
							],
						},
						{
							title: '国际接轨',
							items: [
								{
									label: 'GitHub',
									href: 'https://github.com/1341524165',
								},
								{
									label: 'Instagram',
									href: 'https://www.instagram.com/fengyuanjunn/',
								},
							],
						},
					],
					copyright: `@OYY  冯源濬`,
				},
				prism: {
					theme: lightCodeTheme,
					darkTheme: darkCodeTheme,
					additionalLanguages: ['java'],
				},
				colorMode: {
					defaultMode: 'dark',
					disableSwitch: false,
					respectPrefersColorScheme: false,
				},
				tableOfContents: {
					minHeadingLevel: 2,
					maxHeadingLevel: 5,
				},
			},
	};
};
