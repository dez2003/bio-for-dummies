import type { RetrievalResult, Source } from '@bio-agent/types';
import { fetchWikipedia } from './wikipedia.js';
import { fetchPubMed } from './pubmed.js';
import { fetchUniProt } from './uniprot.js';

export async function retrieveInformation(term: string): Promise<RetrievalResult> {
  console.log(`🔍 Retrieving information for: ${term}`);

  // Fetch from all sources in parallel
  const [wikiResult, pubmedResults, uniprotResult] = await Promise.all([
    fetchWikipedia(term),
    fetchPubMed(term),
    fetchUniProt(term)
  ]);

  // Aggregate sources
  const sources: Source[] = [];
  
  if (wikiResult) {
    sources.push(wikiResult);
  }
  
  sources.push(...pubmedResults);
  
  if (uniprotResult) {
    sources.push(uniprotResult);
  }

  // Create summary from available sources
  let summary = '';
  
  if (wikiResult?.snippet) {
    summary = wikiResult.snippet;
  } else if (uniprotResult?.snippet) {
    summary = uniprotResult.snippet;
  } else if (pubmedResults.length > 0 && pubmedResults[0].snippet) {
    summary = pubmedResults[0].snippet;
  } else {
    summary = `Information about ${term} from various biomedical sources.`;
  }

  console.log(`✅ Retrieved ${sources.length} sources`);

  return {
    summary,
    sources
  };
}

