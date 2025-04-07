import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '使いやすい',
    Svg: require('@site/static/img/easy-to-use.svg').default,
    description: (
      <>
        Go-Sailは非常に使いやすいです。開発者は最もシンプルで最も信頼性の高い方法でサービスを構築できます。
      </>
    ),
  },
  {
    title: 'ビジネスロジックに集中',
    Svg: require('@site/static/img/focus-on-what-matters.svg').default,
    description: (
      <>
        Go-Sailは開発者が自分のビジネスロジックに集中できるようにすることで、他の細事を無視できます。
      </>
    ),
  },
  {
    title: 'Goで実装',
    Svg: require('@site/static/img/powered-by-go.svg').default,
    description: (
      <>
        依存するGoのクロスプラットフォーム特性により、サービスは容易に任意のプラットフォーム間で移植できます。
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
