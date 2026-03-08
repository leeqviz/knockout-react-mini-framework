import type { ReactNode } from 'react';
import styles from './default-container.module.css';

interface DefaultContainerProps {
  children: ReactNode;
  moduleName: string;
}

export function DefaultContainer({
  children,
  moduleName,
}: DefaultContainerProps) {
  return (
    <div className={styles['main-container']}>
      <h3 className={styles['title']}>React component ({moduleName})</h3>
      {children}
    </div>
  );
}
