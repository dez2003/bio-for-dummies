import OpenAI from 'openai';
import type { UserPreferences, RetrievalResult, AnswerMessage } from '@bio-agent/types';
import { retrieveInformation } from '../retrieval/index.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPTS = {
  ELI5: `You are Bio Agent, a biomedical explainer who makes complex biology simple and fun. 
Use everyday analogies and simple language that a 5-year-old could understand. 
Be concise (2-3 sentences max unless more detail is explicitly requested).
Never fabricate information - if you're uncertain, say so clearly.`,

  Scientific: `You are Bio Agent, a precise biomedical explainer for educated audiences.
Use accurate scientific terminology but define key terms briefly in parentheses.
Be concise (2-3 sentences) unless more detail is explicitly requested.
Never fabricate information - if you're uncertain, say so clearly.`
};

export async function generateAnswer(
  query: string,
  preferences: UserPreferences,
  context?: string
): Promise<AnswerMessage> {
  console.log(`🤖 Generating answer for: "${query}" in ${preferences.mode} mode`);

  try {
    // Step 1: Retrieve information from external sources
    const retrievalResult = await retrieveInformation(query);

    // Step 2: Build prompt with retrieved information
    const systemPrompt = SYSTEM_PROMPTS[preferences.mode];
    
    let userPrompt = `Question: ${query}\n\n`;
    
    if (context) {
      userPrompt += `Context from user's page: ${context}\n\n`;
    }
    
    userPrompt += `Retrieved information:\n${retrievalResult.summary}\n\n`;
    
    if (preferences.detail === 'summary+sources') {
      userPrompt += `Available sources:\n`;
      retrievalResult.sources.forEach((source, idx) => {
        userPrompt += `${idx + 1}. ${source.title}\n`;
      });
      userPrompt += `\nProvide a clear explanation and mention that sources are available.`;
    } else {
      userPrompt += `Provide a clear, concise explanation.`;
    }

    // Step 3: Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const summary = completion.choices[0]?.message?.content || 'Unable to generate explanation.';

    // Step 4: Format response
    const answer: AnswerMessage = {
      type: 'answer',
      summary: summary.trim(),
      mode: preferences.mode
    };

    // Include sources if requested
    if (preferences.detail === 'summary+sources' && retrievalResult.sources.length > 0) {
      answer.sources = retrievalResult.sources.slice(0, 4); // Max 4 sources
    }

    console.log(`✅ Generated answer (${answer.summary.length} chars)`);
    return answer;

  } catch (error) {
    console.error('LLM generation error:', error);
    return {
      type: 'answer',
      summary: 'I encountered an error while processing your question. Please try again.',
      mode: preferences.mode
    };
  }
}

