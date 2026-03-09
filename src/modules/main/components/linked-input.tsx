import { useAppStore } from '@/lib/react/hooks/state-management';
import { useId } from 'react';
import styles from './linked-input.module.css';

export function LinkedInput() {
  const id = useId();

  const count = useAppStore((state) => state.count);
  const setCount = useAppStore((state) => state.setCount);

  return (
    <div className="flex flex-col gap-0.5">
      <label htmlFor={id} className={styles['label']}>
        Linked with Knockout: <strong>{count}</strong>
      </label>
      <input
        id={id}
        type="number"
        value={count}
        className={styles['input']}
        onChange={(e) => setCount(e.target.valueAsNumber)}
      />
    </div>
  );
}
