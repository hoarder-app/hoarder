import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Hoarder Docs',
  tagline: 'Dinosaurs are cool',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.hoarder.app',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'MohamedBassem', // Usually your GitHub org/user name.
  projectName: 'hoarder-app', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/hoarder-app/hoarder/tree/main/docs/',
          routeBasePath: "/",
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/opengraph-image.png',
    navbar: {
      title: '',
      logo: {
        alt: 'Hoarder Logo',
        src: 'img/logo-full.svg',
        srcDark: 'img/logo-full-white.svg',
        width: "120px",
      },
      items: [
        {
          href: 'https://hoarder.app',
          label: 'Homepage',
          position: 'right',
        },
        {
          href: 'https://github.com/hoarder-app/hoarder',
          label: 'GitHub',
          position: 'right',
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
              label: 'Introduction',
              to: '/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/hoarder-app/hoarder',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Homepage',
              href: 'https://hoarder.app',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/hoarder-app/hoarder',
            },
            {
              label: 'Demo',
              href: 'https://try.hoarder.app',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Hoarder App. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
