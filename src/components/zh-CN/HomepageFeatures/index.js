import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '易于使用',
    Svg: require('@site/static/img/easy-to-use.svg').default,
    description: (
      <>
        Go-Sail的设计非常易于启动。帮助开发者以最简单、最可靠的方式构建服务。
      </>
    ),
  },
  {
    title: '专注业务',
    Svg: require('@site/static/img/focus-on-what-matters.svg').default,
    description: (
      <>
        Go-Sail让开发者只专注于自己的业务逻辑，而忽略其他琐事。
      </>
    ),
  },
  {
    title: '用Go实现',
    Svg: require('@site/static/img/powered-by-go.svg').default,
    description: (
      <>
        依托Go的跨平台特性，您的服务可以轻松地在任意平台之间移植。
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
