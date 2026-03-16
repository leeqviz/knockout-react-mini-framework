import { useAppStore } from '@/shared/store';

export function UsersList() {
  const users = useAppStore((state) => state.users);
  const addUser = useAppStore((state) => state.addUser);

  return (
    <div>
      <div>Linked users: {users.length}</div>
      {users.map((u) => (
        <div key={u.id}> - {u.name}</div>
      ))}
      <button
        className="border border-blue-500 rounded px-2 py-1 bg-red-300"
        onClick={() => addUser('React User')}
      >
        Add user
      </button>
    </div>
  );
}
