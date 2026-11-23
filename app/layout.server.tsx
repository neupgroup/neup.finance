import { cookies } from 'next/headers';
import type { HeaderAccount } from '@/components/layout/header';
import { ensureAccountRecord } from '@/server/account';

// Resolve the account shown in the application shell from the current auth cookie.
export async function getLayoutAccount(): Promise<HeaderAccount | null> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth')?.value?.trim();

  if (!authToken) return null;

  try {
    const record = await ensureAccountRecord(authToken);
    if (!record) return null;

    return {
      displayName: record.displayName,
      displayImage: record.displayImage,
      neupid: record.neupid,
    };
  } catch {
    return null;
  }
}
