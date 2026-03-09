export function getCurrentISODate() {
  return new Date().toISOString().split('T')[0] || '';
}
