import type { CSSProperties } from 'react';

import classes from './RocketProgressBar.module.css';

const pigRunnerSource = require('@/assets/images/pig-running-coins-progress.png');

type RocketProgressBarProps = {
  progress: number;
};

const clampProgress = (progress: number) => Math.max(0, Math.min(progress, 100));
const FILL_LEFT_INSET = 2;
const FILL_RIGHT_INSET = 5;

export const RocketProgressBar = ({ progress }: RocketProgressBarProps) => {
  const clampedProgress = clampProgress(progress);
  const progressRatio = Math.max(clampedProgress / 100, 0.01);
  const style = {
    '--progress': `${clampedProgress}%`,
    '--progress-fill-left-inset': `${FILL_LEFT_INSET}px`,
    '--progress-fill-width': `calc(${clampedProgress}% - ${(FILL_LEFT_INSET + FILL_RIGHT_INSET) * progressRatio}px)`,
    '--progress-fill-bg-size': `${100 / progressRatio}%`,
  } as CSSProperties;

  return (
    <div className={classes.wrap}>
      <div className={classes.megaProgress} style={style}>
        <div className={classes.megaFill} />
        <div className={classes.runner}>
          <img className={classes.runnerImg} src={pigRunnerSource} alt="" />
        </div>
      </div>
    </div>
  );
};
