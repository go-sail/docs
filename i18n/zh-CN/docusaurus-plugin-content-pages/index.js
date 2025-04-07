import clsx from 'clsx';
import Link from '@docusaurus/Link';
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
        <p className="hero__subtitle">一个轻量的渐进式Golang Web框架。</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/overview">
            准备开始
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

export default function Home() {
  // const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`欢迎`}
      description="Go-Sail是用Go语言实现的轻量的渐进式Web框架。">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
