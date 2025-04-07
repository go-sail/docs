import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Easy to Use',
    Svg: require('@site/static/img/easy-to-use.svg').default,
    description: (
      <>
        Go-Sail is designed to be extremely simple to start. Help developers build services in the simplest and most reliable way.
      </>
    ),
  },
  {
    title: 'Focus on What Matters',
    Svg: require('@site/static/img/focus-on-what-matters.svg').default,
    description: (
      <>
        Go-Sail allows developers to only focus on their own business logic and ignore other chores.
      </>
    ),
  },
  {
    title: 'Powered by Go',
    Svg: require('@site/static/img/powered-by-go.svg').default,
    description: (
      <>
        Relying on Go's cross-platform features, your services can be easily transplanted between any platforms.
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
