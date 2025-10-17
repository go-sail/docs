import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/zh-CN/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">A lightweight progressive Web framework written in Go.</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/overview">
            Getting Started
          </Link>
        </div>
        <p className={styles.state_badges}>
          <a href="https://github.com/keepchen/go-sail/actions/workflows/go.yml" target="_blank">
            <img src="https://github.com/keepchen/go-sail/actions/workflows/go.yml/badge.svg" alt="Go"/>
          </a>  
          <a href="https://github.com/keepchen/go-sail/actions/workflows/codeql.yml" target="_blank">
            <img src="https://github.com/keepchen/go-sail/actions/workflows/codeql.yml/badge.svg" alt="CodeQL"/>
          </a>  
          <a href="https://goreportcard.com/report/github.com/keepchen/go-sail/v3" target="_blank">
            <img src="https://goreportcard.com/badge/github.com/keepchen/go-sail/v3" alt="Go Report Card"/>
          </a><br/>
          <img src="https://img.shields.io/github/stars/keepchen/go-sail?color=1e94de&amp;style=flat-square&amp;logo=github" alt="GitHub Repo stars"/> 
          <img src="https://img.shields.io/github/watchers/keepchen/go-sail?color=1e94de&amp;style=flat-square&amp;logo=github" alt="GitHub watchers"/>
          <img src="https://img.shields.io/github/forks/keepchen/go-sail?color=1e94de&amp;style=flat-square&amp;logo=github" alt="GitHub forks"/>
          <img src="https://img.shields.io/github/v/tag/keepchen/go-sail?color=ff0000&amp;style=flat-square&amp;logo=go&amp;label=LATEST_RELEASE" alt="Latest release"/>
        </p>
      </div>
    </header>
  );
}

const locales = {
  'en-US': {
    ogImage: 'img/og-en-US.png',
  },
  'zh-CN': {
    ogImage: 'img/og-zh-CN.png',
  },
  'ja-JP': {
    ogImage: 'img/og-ja-JP.png',
  },
}

export default function Home() {
  const { i18n, siteConfig } = useDocusaurusContext();
  const currentLocale = i18n.currentLocale;
  
  return (
    <>
      <Head>
        <meta property="og:image" content={locales[currentLocale].ogImage} />
      </Head>
      <Layout
        title={`Welcome`}
        description="Go-Sail is a lightweight progressive Web framework written in Go.">
        <HomepageHeader />
        <main>
          <HomepageFeatures />
        </main>
      </Layout>
    </>
  );
}
