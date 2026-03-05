import jquery from 'jquery';

declare global {
  interface Window {
    $: typeof jquery;
    jQuery: typeof jquery;
  }
}
window.$ = jquery;
window.jQuery = jquery;

export default jquery;
