export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    // Convert Anthropic format messages to OpenAI/Groq format
    const messages = req.body.messages.map(msg => ({
      role: msg.role,
      content: Array.isArray(msg.content)
        ? msg.content.filter(c => c.type === 'text').map(c => c.text).join('\n')
        : msg.content
    }));

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4096,
        messages: [
          {
            role: 'system',
            content: req.body.system || `Kamu adalah TAUFIQ KING CODER, platform analisis saham & crypto profesional.

Spesialisasi:
- Analisis fundamental & teknikal saham IDX (BBCA, TLKM, GOTO, BRIS, dll)
- Analisis crypto: BTC, ETH, SOL, BNB, altcoin
- Interpretasi chart/grafik candlestick
- Analisis laporan keuangan, data CSV
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

    // Convert Groq response to Anthropic format
    return res.status(200).json({
      content: [{ type: 'text', text: data.choices[0].message.content }]
    });

  } catch (err) {
    return res.status(500).json({ error: 'Proxy error: ' + err.message });
  }
}
