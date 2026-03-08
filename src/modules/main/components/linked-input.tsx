import { useId } from 'react';
import styles from './linked-input.module.css';

interface LinkedInputProps {
  count: number;
  setCount: (value: number) => void;
}

export function LinkedInput({ count, setCount }: LinkedInputProps) {
  const id = useId();

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
