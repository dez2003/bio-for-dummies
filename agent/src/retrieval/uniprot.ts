import axios from 'axios';
import type { Source } from '@bio-agent/types';

export async function fetchUniProt(term: string): Promise<Source | null> {
  try {
    const url = 'https://rest.uniprot.org/uniprotkb/search';
    const params = {
      query: term,
      size: 1,
      format: 'json'
    };

    const response = await axios.get(url, {
      params,
      timeout: 5000,
      headers: {
        'User-Agent': 'BioForDummies/1.0'
      }
    });

    const results = response.data?.results || [];
    
    if (results.length === 0) {
      return null;
    }

    const entry = results[0];
    const accession = entry.primaryAccession;
    const proteinName = entry.proteinDescription?.recommendedName?.fullName?.value || term;
    const function_desc = entry.comments?.find((c: any) => c.commentType === 'FUNCTION')?.texts?.[0]?.value || '';

    return {
      title: `${proteinName} (${accession})`,
      url: `https://www.uniprot.org/uniprotkb/${accession}`,
      snippet: function_desc.slice(0, 200) + (function_desc.length > 200 ? '...' : '')
    };
  } catch (error) {
    console.error('UniProt fetch error:', error);
    return null;
  }
}

