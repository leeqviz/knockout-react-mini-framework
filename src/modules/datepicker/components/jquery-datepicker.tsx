import { $ } from '@/shared/lib/jquery';
import { useAppStore } from '@/shared/store';
import 'jquery-ui/themes/base/core.css';
import 'jquery-ui/themes/base/datepicker.css';
import 'jquery-ui/themes/base/theme.css';
import 'jquery-ui/ui/widgets/datepicker';
import { useEffect, useId, useRef } from 'react';

export function JqueryDatepicker() {
  const id = useId();

  const date = useAppStore((state) => state.date);
  const setDate = useAppStore((state) => state.setDate);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const $element = $(inputRef.current);

    // init
    $element.datepicker({
      dateFormat: 'yy-mm-dd',
      defaultDate: date,
      onSelect: function (dateText: string) {
        setDate(dateText);
      },
    });

    // cleanup
    return () => {
      $element.datepicker('destroy');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync (React -> jQuery)
  useEffect(() => {
    if (inputRef.current) {
      $(inputRef.current).datepicker('setDate', date);
    }
  }, [date]);

  return (
    <div style={{ marginTop: '10px' }}>
      <label
        htmlFor={id}
        style={{ display: 'block', fontSize: '12px', color: '#666' }}
      >
        jQuery Datepicker:
      </label>
      <input
        id={id}
        ref={inputRef}
        type="text"
        readOnly
        style={{
          padding: '5px',
          borderRadius: '4px',
          border: '1px solid #ccc',
        }}
      />
    </div>
  );
}
