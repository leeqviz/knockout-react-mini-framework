import { useAppStore } from '@/stores/app';

export function UsersList() {
  // Подписываемся на пользователей
  const users = useAppStore((state) => state.users);
  const addUser = useAppStore((state) => state.addUser);

  return (
    <div>
      {users.map((u) => (
        <div key={u.id}>{u.name}</div>
      ))}
      <button onClick={() => addUser('Новый юзер')}>Добавить</button>
    </div>
  );
}
