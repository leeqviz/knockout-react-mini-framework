// 1. СНАЧАЛА инициализируем глобальный jQuery
import '@/lib/jquery/global';

// 2. ТОЛЬКО ПОТОМ загружаем плагин, теперь он найдет window.jQuery
import $ from 'jquery'; // Подключаем родные стили jQuery UI
import 'jquery-ui/themes/base/core.css';
import 'jquery-ui/themes/base/datepicker.css'; // Подключаем сам jQuery UI, чтобы плагин заработал
import 'jquery-ui/themes/base/theme.css';
import 'jquery-ui/ui/widgets/datepicker';
import { useEffect, useRef } from 'react';

// 1. Описываем пропсы: что React будет передавать в наш плагин
interface TestDatepickerProps {
  date: string;
  setDate: (newDate: string) => void;
}

export function TestDatepicker({ date, setDate }: TestDatepickerProps) {
  // 2. Создаем «Якорь» (Ref). Это прямая ссылка на реальный DOM-элемент,
  // в обход Virtual DOM.
  const inputRef = useRef<HTMLInputElement>(null);

  // 3. useEffect с пустым массивом [] сработает ровно ОДИН РАЗ,
  // когда компонент появится на экране (аналог метода init в Knockout-мосте)
  useEffect(() => {
    // Убеждаемся, что элемент существует
    if (!inputRef.current) return;

    // Оборачиваем наш реальный инпут в jQuery-объект
    const $element = $(inputRef.current);

    // Инициализируем старый плагин
    $element.datepicker({
      dateFormat: 'yy-mm-dd',
      defaultDate: date,
      // 4. КОНТАКТ: Когда пользователь выбирает дату в jQuery,
      // мы сообщаем об этом React'у через коллбэк
      onSelect: function (dateText: string) {
        setDate(dateText);
      },
    });

    // 5. УБОРКА (Очистка памяти):
    // Эта функция вызовется, когда React решит удалить компонент со страницы.
    return () => {
      // Мы обязаны сказать jQuery уничтожить плагин,
      // иначе он останется висеть в памяти браузера!
      $element.datepicker('destroy');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- Пустой массив зависимостей означает "выполнить только при монтировании"

  // 6. СИНХРОНИЗАЦИЯ (React -> jQuery)
  // Если проп date изменится извне (в родительском React-компоненте),
  // нам нужно заставить jQuery обновить UI.
  useEffect(() => {
    if (inputRef.current) {
      $(inputRef.current).datepicker('setDate', date);
    }
  }, [date]); // Следим за изменением date

  // 7. Рендер: React рисует АБСОЛЮТНО пустой инпут.
  // Никаких value={} или onChange={}. Только наш якорь (ref).
  return (
    <div style={{ marginTop: '10px' }}>
      <label style={{ display: 'block', fontSize: '12px', color: '#666' }}>
        jQuery Datepicker:
      </label>
      <input
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
