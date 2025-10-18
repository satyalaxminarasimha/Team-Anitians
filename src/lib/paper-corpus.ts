
/**
 * @fileOverview This file is now deprecated. The application dynamically indexes
 * PDF content uploaded by the user instead of relying on this static corpus.
 * The logic for indexing is now in `/src/services/indexing.service.ts` and is
 * triggered via the UI in `/src/app/admin/upload/page.tsx`.
 */

export const paperCorpus = new Map<string, string>();
