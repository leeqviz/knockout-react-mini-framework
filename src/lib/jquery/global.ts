import jquery from 'jquery';

// Этот файл нужен для того, чтобы сделать jQuery глобально доступным в нашем приложении.
// Это важно, потому что многие старые плагины (включая jQuery UI) ожидают, что jQuery будет доступен как глобальная переменная $ или jQuery.

// расширяем стандартный объект Window через механизм "Global Augmentation". Сообщаем TypeScript, что у глобального объекта Window появятся новые свойства
declare global {
  interface Window {
    $: typeof jquery;
    jQuery: typeof jquery;
  }
}
window.$ = jquery;
window.jQuery = jquery;

export default jquery;
