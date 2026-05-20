const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Read API key from environment ──────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// ── Middleware ──────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── System prompt: TechNova product knowledge ──────────────────
const SYSTEM_PROMPT = `You are **Nova**, the friendly and professional AI customer support assistant for **TechNova Electronics** — a premium consumer electronics brand.

## Your Personality
- Warm, helpful, and concise. Never robotic.
- Use emojis sparingly and professionally (1-2 per response max).
- Keep answers focused — no walls of text unless listing products.
- If you don't know something, say so honestly and offer to connect with human support.

## Company Info
- Brand: TechNova Electronics
- Tagline: "Premium tech, delivered fast."
- Phone: +1 (800) 836-4682 (Mon–Fri 9am–6pm EST)
- Email: support@technova-electronics.com
- Website: www.technova-electronics.com

## Product Catalog

**Smartphones:**
- TechNova X15 Pro — $899 (6.7" OLED, 200MP camera, Snapdragon 8 Gen 3, 512GB, IP68)
- TechNova X15 — $649 (6.1" OLED, 108MP, 256GB)
- TechNova Lite — $349 (6.5" LCD, 64MP, 5500mAh battery)

**Laptops:**
- ProBook Ultra 16 — $1,299 (16" 4K, i9, 32GB RAM, RTX 4060, 2yr warranty)
- ProBook Air 14 — $799 (14" 2K, i7, 16GB, 20hr battery, 1.2kg)
- ProBook Student — $499 (15.6" FHD, i5, 8GB, free Microsoft 365)

**Audio:**
- NovaBuds Pro — $199 (ANC, 36hr battery, Hi-Res, IPX5)
- NovaBuds Air — $99 (open-ear, 32hr battery)
- NovaSound Bar — $349 (Dolby Atmos, 240W, HDMI ARC)

**Smartwatches:**
- NovaWatch Elite — $399 (ECG, GPS, 7-day battery, 5ATM)
- NovaWatch Fit — $199 (SpO2, 10-day battery, 100+ workouts)

**Accessories:** NovaCam 4K ($149), NovaHub USB-C ($79), NovaCharger 100W ($49)

## Policies
- **Shipping:** Free on $50+ orders. Standard 5-7 days, Expedited $9.99 (2-3 days), Overnight $24.99. International to 40+ countries.
- **Returns:** 30-day free returns, no questions asked. Refund in 3-5 business days.
- **Warranty:** Smartphones 1yr, Laptops 2yr, Audio 1yr, Watches 1yr. TechNova Care+ extends +2yr with accidental coverage.
- **Payment:** Visa, MC, Amex, PayPal, Apple/Google Pay. Klarna & Afterpay available. 0% APR 12-month financing on $500+.
- **Discounts:** Student 10% (code STUDENT10), bundles save up to 15%, loyalty rewards program.

## Rules
- Only discuss TechNova products and policies. Politely redirect off-topic questions.
- Never make up product specs or pricing — only use the info above.
- For order-specific questions (tracking, cancellations), direct to the website or phone support.
- Format responses cleanly with line breaks. Use bold for product names and prices.`;

// ── AI Chat Endpoint ───────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  // If no API key — use simple fallback
  if (!GEMINI_API_KEY) {
    return res.json({
      reply: getFallbackReply(message),
      source: 'fallback'
    });
  }

  try {
    // Build conversation for Gemini
    const contents = [];

    // Add conversation history (last 10 exchanges max)
    const recentHistory = (history || []).slice(-20);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API error:', response.status, errorBody);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      throw new Error('No response from AI');
    }

    res.json({ reply, source: 'ai' });

  } catch (err) {
    console.error('Chat error:', err.message);
    res.json({
      reply: getFallbackReply(message),
      source: 'fallback'
    });
  }
});

// ── Fallback (no API key / API error) ──────────────────────────
// Track last matched topic for follow-up questions
let lastTopic = null;

function getFallbackReply(message) {
  const msg = message.toLowerCase();

  // Word-boundary match for short keywords, substring for longer ones
  function matches(keyword) {
    if (keyword.length < 4) {
      return new RegExp(`\\b${keyword}\\b`).test(msg);
    }
    return msg.includes(keyword);
  }

  const responses = [
    { keys: ['compare', 'better', 'best', 'recommend', 'which one', 'difference', 'vs'],
      reply: () => {
        if (lastTopic === 'phone') return "Great question! Here's a quick comparison:\n\n📱 **X15 Pro** ($899) — Best camera (200MP) & performance. For power users.\n📱 **X15** ($649) — Best value. Great all-rounder for most people.\n📱 **Lite** ($349) — Best battery life. Perfect for budget-conscious buyers.\n\n**My pick:** The **X15** hits the sweet spot for most users. Want to know more about any specific model?";
        if (lastTopic === 'laptop') return "Here's how they compare:\n\n💻 **ProBook Ultra 16** ($1,299) — Best for creative pros & gaming.\n💻 **Air 14** ($799) — Best for portability (1.2kg, 20hr battery).\n💻 **Student** ($499) — Best value with free Microsoft 365.\n\n**My pick:** The **Air 14** is the best all-rounder. Need more details?";
        if (lastTopic === 'audio') return "Quick comparison:\n\n🎧 **NovaBuds Pro** ($199) — Best sound with ANC. For audiophiles.\n🎧 **NovaBuds Air** ($99) — Most comfortable (open-ear). For everyday use.\n🔊 **NovaSound Bar** ($349) — Best home audio with Dolby Atmos.";
        if (lastTopic === 'watch') return "Let me compare:\n\n⌚ **NovaWatch Elite** ($399) — Best features (ECG, GPS, 7-day battery). For health-focused users.\n⌚ **NovaWatch Fit** ($199) — Best value. 10-day battery, 100+ workouts. Great starter smartwatch.";
        return "I'd be happy to compare! Which category are you interested in — **smartphones**, **laptops**, **audio**, or **smartwatches**?";
      }
    },
    { keys: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon'],
      reply: () => { lastTopic = null; return "Hello! 👋 Welcome to TechNova Electronics. I'm Nova, your support assistant. How can I help you today?"; }
    },
    { keys: ['product', 'sell', 'catalog', 'what do you'],
      reply: () => { lastTopic = null; return "We offer **Smartphones** (from $349), **Laptops** (from $499), **Audio** (from $99), and **Smartwatches** (from $199). What interests you?"; }
    },
    { keys: ['phone', 'smartphone', 'x15', 'mobile'],
      reply: () => { lastTopic = 'phone'; return "Our phones: **X15 Pro** ($899) — flagship with 200MP camera, **X15** ($649) — great all-rounder, **Lite** ($349) — best battery life. Want details on any?"; }
    },
    { keys: ['laptop', 'probook', 'computer', 'notebook'],
      reply: () => { lastTopic = 'laptop'; return "Our laptops: **ProBook Ultra 16** ($1,299) — powerhouse, **Air 14** ($799) — 20hr battery, **Student** ($499) — with free Microsoft 365."; }
    },
    { keys: ['earbuds', 'audio', 'headphone', 'soundbar', 'speaker', 'buds'],
      reply: () => { lastTopic = 'audio'; return "Audio lineup: **NovaBuds Pro** ($199) with ANC, **NovaBuds Air** ($99) open-ear, and **NovaSound Bar** ($349) with Dolby Atmos."; }
    },
    { keys: ['watch', 'smartwatch', 'wearable'],
      reply: () => { lastTopic = 'watch'; return "Smartwatches: **NovaWatch Elite** ($399) with ECG & GPS, **NovaWatch Fit** ($199) with 10-day battery. Both work with iOS & Android."; }
    },
    { keys: ['price', 'cost', 'how much', 'discount', 'deal', 'offer', 'coupon'],
      reply: () => "Prices start at $49 for accessories up to $1,299 for laptops. We offer **10% student discount** (code: STUDENT10), bundle deals up to 15% off, and 0% financing on $500+."
    },
    { keys: ['ship', 'delivery', 'deliver', 'track', 'order status'],
      reply: () => "**Free shipping** on orders $50+. Standard: 5-7 days, Expedited: 2-3 days ($9.99), Overnight: next day ($24.99). International available to 40+ countries."
    },
    { keys: ['return', 'refund', 'exchange'],
      reply: () => "We offer **30-day hassle-free returns**. Refund processed in 3-5 business days. Free prepaid return labels included."
    },
    { keys: ['warranty', 'repair', 'broken', 'damaged'],
      reply: () => "All products include warranty (1-2 years). **TechNova Care+** adds 2 extra years + accidental damage coverage. Call +1 (800) 836-4682 for claims."
    },
    { keys: ['contact', 'support', 'human', 'call', 'email', 'agent'],
      reply: () => "Reach us at: 📞 **+1 (800) 836-4682** (Mon-Fri 9-6 EST), 📧 **support@technova-electronics.com**, or 💬 live chat on our website."
    },
    { keys: ['thank', 'bye', 'goodbye', 'thanks'],
      reply: () => { lastTopic = null; return "You're welcome! Thanks for choosing TechNova. Reach us anytime at +1 (800) 836-4682 or support@technova-electronics.com. Have a great day! 😊"; }
    },
    { keys: ['pay', 'payment', 'credit card', 'financing', 'installment'],
      reply: () => "We accept Visa, Mastercard, Amex, PayPal, Apple Pay, and Google Pay. **Klarna** and **Afterpay** for buy-now-pay-later. 0% APR financing on orders $500+."
    },
  ];

  for (const r of responses) {
    if (r.keys.some(matches)) return r.reply();
  }

  return "I'd be happy to help! I can assist with our **products**, **pricing**, **shipping**, **returns**, **warranty**, or connect you with our support team. What would you like to know?";
}



// ── Health check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    ai: GEMINI_API_KEY ? 'enabled' : 'fallback',
    timestamp: new Date().toISOString()
  });
});

// ── Status endpoint (for frontend) ────────────────────────────
app.get('/api/status', (req, res) => {
  res.json({ aiEnabled: !!GEMINI_API_KEY });
});

// ── Catch-all ──────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🤖 TechNova Support Chatbot is running!`);
  console.log(`   Local:  http://localhost:${PORT}`);
  console.log(`   AI:     ${GEMINI_API_KEY ? '✅ Gemini API connected' : '⚠️  No API key — using fallback mode'}`);
  console.log(`   ${GEMINI_API_KEY ? '' : '  Set GEMINI_API_KEY env variable for AI responses'}`);
  console.log(`   Ready to help customers!\n`);
});
