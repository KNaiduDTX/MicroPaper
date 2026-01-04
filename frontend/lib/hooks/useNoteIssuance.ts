/**
 * Note issuance hook
 */

import { useApi } from './useApi';
import { custodianApi } from '@/lib/api/custodian';
import { NoteIssuanceRequest, NoteIssuanceResponse } from '@/types/note';

export function useNoteIssuance() {
  const issueNote = useApi<NoteIssuanceResponse, [NoteIssuanceRequest]>(custodianApi.issueNote);

  const issue = async (data: NoteIssuanceRequest) => {
    return issueNote.execute(data);
  };

  return {
    issue,
    loading: issueNote.loading,
    error: issueNote.error,
    data: issueNote.data,
    reset: issueNote.reset,
  };
}

