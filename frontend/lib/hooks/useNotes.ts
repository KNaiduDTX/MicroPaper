/**
 * Notes list hook
 */

import { useApi } from './useApi';
import { custodianApi, GetNotesParams } from '@/lib/api/custodian';
import { NoteIssuance } from '@/lib/api/custodian';

export function useNotes() {
  const getNotes = useApi<NoteIssuance[], [GetNotesParams?]>(custodianApi.getNotes);

  const fetchNotes = async (params?: GetNotesParams) => {
    return getNotes.execute(params);
  };

  return {
    fetchNotes,
    loading: getNotes.loading,
    error: getNotes.error,
    data: getNotes.data,
    reset: getNotes.reset,
  };
}
