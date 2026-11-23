import logica from '@neup/logica';
import { prisma } from '@neup/core/database/prisma';

/**
 * Validates an auth token and keeps its local account profile synchronized.
 */
export async function ensureAccountRecord(authToken?: string | null) {
  if (!authToken?.trim()) return null;

  const authentication = await logica.account.self.isAuthenticated('local', authToken);
  if (!authentication.authenticated) return null;

  const payload = 'payload' in authentication ? authentication.payload : null;
  const accountId = payload?.aid;
  if (typeof accountId !== 'string' || !accountId.trim()) return null;

  const basics = (await logica.account.self.getBasics(authToken))[0];
  const existing = await prisma.account.findUnique({ where: { id: accountId } });

  return prisma.account.upsert({
    where: { id: accountId },
    create: {
      id: accountId,
      displayName: basics?.displayName ?? '',
      displayImage: basics?.displayImage ?? '',
      neupid: basics?.neupid ?? '',
    },
    update: {
      displayName: basics?.displayName ?? existing?.displayName ?? '',
      displayImage: basics?.displayImage ?? existing?.displayImage ?? '',
      neupid: basics?.neupid ?? existing?.neupid ?? '',
    },
  });
}
