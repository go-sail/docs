// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Go-Sail',
  tagline: 'A lightweight progressive Web Framework written in Go.',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://go-sail.dev',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'go-sail', // Usually your GitHub org/user name.
  projectName: 'docs', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN', 'ja-JP'],
    localeConfigs: {
      // en: {
      //   label: 'English',
      //   direction: 'ltr',
      // },
      'en-US': {
        label: 'English',
        direction: 'ltr',
      },
      'zh-CN': {
        label: '简体中文',
        direction: 'ltr',
      },
      'ja-JP': {
        label: '日文',
        direction: 'ltr',
      },
    },
  },

  plugins: [
    [
      '@docusaurus/plugin-sitemap',
      {
        id: 'sitemap',
        // 核心配置：覆盖默认生成逻辑
        createSitemapItems: async (params) => {
          const defaultSitemapItems = await params.defaultCreateSitemapItems(params);
          const { siteConfig } = params;
          
          // 生成多语言路径
          return defaultSitemapItems.flatMap((item) => {
            return siteConfig.i18n.locales.map((locale) => ({
              ...item,
              url: `${siteConfig.url}/${locale}${item.url.replace(siteConfig.url, '')}`.endsWith('/') ? `${siteConfig.url}/${locale}${item.url.replace(siteConfig.url, '')}` : `${siteConfig.url}/${locale}${item.url.replace(siteConfig.url, '')}/`, //`${siteConfig.url}/${locale}${item.url.replace(siteConfig.baseUrl, '')}`,
              changefreq: 'weekly',
              priority: 0.9,
            }));
          });
        },
      },
    ],
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          editUrl:
            'https://github.com/go-sail/docs/',
          // versions: {
          //   current: {
          //     label: 'Current',
          //     path: '',
          //   },
          //   'v3': {
          //     label: 'v3',
          //     path: 'v3',
          //   },
          // },
          // lastVersion: 'current',
          // onlyIncludeVersions: ['current', 'v3'],
        },
        // blog: {
        //   showReadingTime: true,
        //   feedOptions: {
        //     type: ['rss', 'atom'],
        //     xslt: true,
        //   },
        //   // Please change this to your repo.
        //   // Remove this to remove the "edit this page" links.
        //   editUrl:
        //     'https://github.com/go-sail/docs/',
        //   // Useful options to enforce blogging best practices
        //   onInlineTags: 'warn',
        //   onInlineAuthors: 'warn',
        //   onUntruncatedBlogPosts: 'warn',
        // },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/logo.png',
      navbar: {
        title: 'Go-Sail',
        logo: {
          alt: 'Go-Sail Logo',
          src: 'img/logo.svg',
        },
        items: [
          // {
          //   type: 'docSidebar',
          //   sidebarId: 'tutorialSidebar',
          //   position: 'left',
          //   label: 'Tutorial',
          // },
          // {to: '/blog', label: 'Blog', position: 'left'},
          {
            type: 'docsVersionDropdown',
            position: 'right',
            dropdownItemsBefore: [],
            dropdownItemsAfter: [],
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/keepchen/go-sail',
            // label: 'Github',
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Overview',
                to: '/docs/overview',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              // {
              //   label: 'Stack Overflow',
              //   href: 'https://stackoverflow.com/questions/tagged/docusaurus',
              // },
              // {
              //   label: 'Discord',
              //   href: 'https://discordapp.com/invite/docusaurus',
              // },
              {
                label: 'Twitter',
                href: 'https://twitter.com/wowgogoing',
              },
            ],
          },
          {
            title: 'More',
            items: [
              // {
              //   label: 'Blog',
              //   to: '/blog',
              // },
              {
                label: 'GitHub',
                href: 'https://github.com/keepchen/go-sail',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Go-Sail, Community. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
      algolia: {
        // The application ID provided by Algolia
        appId: 'EJ7ONRKD8Y',
  
        // Public API key: it is safe to commit it
        apiKey: 'c372d3e28150ce1a956e6a0c469cf265',
  
        indexName: 'go_sail_dev_ej7onrkd8y_pages',
  
        // Optional: see doc section below
        contextualSearch: true,
  
        // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
        externalUrlRegex: 'go-sail\\.dev',
  
        // Optional: Replace parts of the item URLs from Algolia. Useful when using the same search index for multiple deployments using a different baseUrl. You can use regexp or string in the `from` param. For example: localhost:3000 vs myCompany.com/docs
        replaceSearchResultPathname: {
          from: '/docs/', // or as RegExp: /\/docs\//
          to: '/',
        },
  
        // Optional: Algolia search parameters
        searchParameters: {},
  
        // Optional: path for search page that enabled by default (`false` to disable it)
        searchPagePath: 'search',
  
        // Optional: whether the insights feature is enabled or not on Docsearch (`false` by default)
        insights: false,
  
        //... other Algolia params
      },
    }),
};

export default config;
