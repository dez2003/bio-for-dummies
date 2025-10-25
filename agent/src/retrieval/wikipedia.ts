import axios from 'axios';
import type { Source } from '@bio-agent/types';

export async function fetchWikipedia(term: string): Promise<Source | null> {
  try {
    const encodedTerm = encodeURIComponent(term);
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTerm}`;
    
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'BioForDummies/1.0'
      }
    });

    if (response.data && response.data.extract) {
      return {
        title: response.data.title || term,
        url: response.data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedTerm}`,
        snippet: response.data.extract
      };
    }

    return null;
  } catch (error) {
    console.error('Wikipedia fetch error:', error);
    return null;
  }
}

