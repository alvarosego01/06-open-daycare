import { getRooms, getChildren } from './actions';
import KidsListClient from './KidsListClient';

export default async function StaffKidsPage() {
  const [rooms, children] = await Promise.all([getRooms(), getChildren()]);

  return (
    <main className="flex-1 min-w-0 h-screen overflow-y-auto">
      <div className="max-w-[880px] w-full mx-auto px-5 py-8 md:px-10 md:py-[34px] pb-20">
        <KidsListClient rooms={rooms}>
          {children}
        </KidsListClient>
      </div>
    </main>
  );
}
