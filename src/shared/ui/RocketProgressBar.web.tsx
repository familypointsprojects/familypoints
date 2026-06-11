import type { CSSProperties } from 'react';

import classes from './RocketProgressBar.module.css';

const rocketSource = require('../../../design/assets/mascot/easyquest-rocket-cropped.png');

type RocketProgressBarProps = {
  progress: number;
};

const clampProgress = (progress: number) => Math.max(0, Math.min(progress, 100));

export const RocketProgressBar = ({ progress }: RocketProgressBarProps) => {
  const style = {
    '--progress': `${clampProgress(progress)}%`,
  } as CSSProperties;

  return (
    <div className={classes.wrap}>
      <div className={classes.megaProgress} style={style}>
        <div className={classes.megaFill} />
        <img className={classes.rocketImg} src={rocketSource} alt="" />
      </div>
    </div>
  );
};
