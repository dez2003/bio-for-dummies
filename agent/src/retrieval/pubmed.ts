import axios from 'axios';
import type { Source } from '@bio-agent/types';

export async function fetchPubMed(term: string): Promise<Source[]> {
  try {
    // Step 1: Search for articles
    const searchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
    const searchParams = {
      db: 'pubmed',
      term: term,
      retmax: 3,
      sort: 'relevance',
      retmode: 'json'
    };

    const searchResponse = await axios.get(searchUrl, {
      params: searchParams,
      timeout: 5000
    });

    const idList = searchResponse.data?.esearchresult?.idlist || [];
    
    if (idList.length === 0) {
      return [];
    }

    // Step 2: Fetch article summaries
    const summaryUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
    const summaryParams = {
      db: 'pubmed',
      id: idList.join(','),
      retmode: 'json'
    };

    const summaryResponse = await axios.get(summaryUrl, {
      params: summaryParams,
      timeout: 5000
    });

    const results: Source[] = [];
    const resultData = summaryResponse.data?.result;

    if (resultData) {
      for (const id of idList) {
        const article = resultData[id];
        if (article && article.title) {
          results.push({
            title: article.title,
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            snippet: article.source || ''
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('PubMed fetch error:', error);
    return [];
  }
}

