export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    // Convert Anthropic-style messages to OpenAI format (support text + image)
    const messages = req.body.messages.map(msg => {
      if (Array.isArray(msg.content)) {
        const parts = msg.content.map(c => {
          if (c.type === 'text') return { type: 'text', text: c.text };
          if (c.type === 'image') return {
            type: 'image_url',
            image_url: { url: `data:${c.source.media_type};base64,${c.source.data}` }
          };
          return null;
        }).filter(Boolean);
        return { role: msg.role, content: parts };
      }
      return { role: msg.role, content: msg.content };
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://aifinansial.vercel.app',
        'X-Title': 'TAUFIQ KING CODER'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-coder:free',
        max_tokens: 4096,
        messages: [
          {
            role: 'system',
            content: req.body.system ||
`Kamu adalah TAUFIQ KING CODER, platform analisis saham & crypto profesional.

Spesialisasi:
- Analisis fundamental & teknikal saham IDX (BBCA, TLKM, GOTO, BRIS, dll)
- Analisis crypto: BTC, ETH, SOL, BNB, altcoin
- Interpretasi chart/grafik candlestick yang diupload user
- Analisis laporan keuangan, data CSV/file
- Strategi portofolio, DCA, risk management

Gaya: profesional, data-driven, pakai bahasa Indonesia. Sertakan disclaimer risiko bila relevan.`
          },
          ...messages
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    // Convert to Anthropic-style response format
    return res.status(200).json({
      content: [{ type: 'text', text: data.choices[0].message.content }]
    });

  } catch (err) {
    return res.status(500).json({ error: 'Proxy error: ' + err.message });
  }
}
