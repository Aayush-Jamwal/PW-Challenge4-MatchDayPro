// api/coach.js
'use strict';

/**
 * Serverless function for Vercel backend routing.
 * Leverages GEMINI_API_KEY environment variable.
 */
export default async function handler(req, res) {
  // 1. Enforce POST request validation
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // 2. Load secure environment variable
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Gemini API key is not configured as an environment variable in Vercel settings.'
    });
  }

  const { prompt, context } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  // 3. Dispatch secure backend request to Google Gemini API
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${context || ''}\n\nUser request: ${prompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 250
        }
      })
    });

    if (!response.ok) {
      let errorText = await response.text();
      let displayMsg = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        let msg = errorJson.error?.message || errorText;
        if (response.status === 404) {
          const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
          if (listResponse.ok) {
            const listData = await listResponse.json();
            const models = listData.models || [];
            const names = models.map(m => m.name.replace('models/', '')).join(', ');
            msg += `. Available models: [${names}]`;
          }
        }
        displayMsg = msg;
      } catch {
        // Safe fallback
      }
      return res.status(response.status).json({
        error: `Gemini API returned error: ${displayMsg}`
      });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No advice generated.';
    
    return res.status(200).json({ text: replyText });
  } catch (err) {
    return res.status(500).json({
      error: `Failed to fetch response: ${err.message}`
    });
  }
}
