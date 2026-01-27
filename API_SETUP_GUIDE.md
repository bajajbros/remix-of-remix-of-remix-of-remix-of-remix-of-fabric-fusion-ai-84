# AI Lead Generation - API Setup Guide

## Overview
Tumhare system ko sirf **2 FREE API keys** chahiye (Google Maps ki zarurat nahi):
- **Groq API** - Lead enrichment ke liye (FREE - 14,400 requests/day)
- **Gemini API** - Lead scoring ke liye (FREE - 1,500 requests/day)

---

## Step 1: Groq API Key Setup (FREE)

### Kya karna hai:
1. **Website kholo**: https://console.groq.com
2. **Sign Up karo** (Google account se bhi ho jayega)
3. **Left sidebar mein "API Keys" pe click karo**
4. **"Create API Key" button click karo**
5. **Name do**: "Lead Generation System"
6. **Key copy karo** (yeh sirf ek baar dikhega!)

### Groq Key Features:
- ✅ **Completely FREE**
- ✅ **14,400 requests per day** (more than enough!)
- ✅ **Fast response time** (2-3 seconds)
- ✅ **No credit card required**

### Sample Key Format:
```
gsk_1234567890abcdefghijklmnopqrstuvwxyz1234567890
```

---

## Step 2: Gemini API Key Setup (FREE)

### Kya karna hai:
1. **Website kholo**: https://ai.google.dev
2. **"Get API Key in Google AI Studio" click karo**
3. **Google account se login karo**
4. **"Create API Key" button click karo**
5. **"Create API key in new project" select karo**
6. **Key copy karo**

### Gemini Key Features:
- ✅ **Completely FREE**
- ✅ **1,500 requests per day** (sufficient for lead scoring)
- ✅ **Smart AI scoring** (0-100 score dega)
- ✅ **No credit card required**

### Sample Key Format:
```
AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

---

## Step 3: API Keys Database Mein Daalna

### Option 1: Supabase Dashboard Se (EASIEST)

1. **Supabase dashboard kholo**: https://supabase.com
2. **Apna project select karo**
3. **Left sidebar mein "SQL Editor" click karo**
4. **Niche diya gaya SQL copy-paste karo**:

```sql
-- Delete old keys if exist
DELETE FROM app_settings WHERE key IN ('groq_api_key', 'gemini_api_key');

-- Insert your API keys (APNI KEYS DAALO!)
INSERT INTO app_settings (key, value) VALUES
  ('groq_api_key', 'YAHAN_APNI_GROQ_KEY_DAALO'),
  ('gemini_api_key', 'YAHAN_APNI_GEMINI_KEY_DAALO');
```

5. **Apni actual keys daalo** (YAHAN_APNI_GROQ_KEY_DAALO aur YAHAN_APNI_GEMINI_KEY_DAALO ko replace karo)
6. **"Run" button click karo**
7. **"Success" message aana chahiye**

### Option 2: Application Se (Settings Page)

*(Future update mein UI se directly add kar sakte ho)*

---

## Step 4: Testing Karo

### Test kaise kare:

1. **Application kholo**
2. **"Lead Generation" page pe jao**
3. **Industry select karo** (e.g., "Retail")
4. **Location select karo** (e.g., "Mumbai")
5. **"Auto Generate" button click karo**
6. **Wait karo 10-15 seconds**

### Kya hoga:
1. ⚙️ System 7 businesses generate karega (realistic data)
2. 🤖 Groq AI se har lead ko enrich karega:
   - Sticker needs identify karega
   - Estimated order value calculate karega
   - Suggested pitch generate karega
3. 📊 Gemini AI se har lead ko score karega:
   - 0-100 score dega
   - Priority set karega (Hot/Warm/Cold)
   - Confidence level batayega

### Success Indicators:
✅ Leads table mein new entries aayi
✅ Har lead mein AI-generated pitch dikha
✅ Har lead ka score (0-100) dikh raha hai
✅ Priority badges (Hot/Warm/Cold) dikh rahe hain

---

## Daily Usage Limits

### Groq API:
- **Free Tier**: 14,400 requests/day
- **Tumhare usage**: ~7 requests per generation
- **Daily generations possible**: ~2,000 lead generations! 🔥

### Gemini API:
- **Free Tier**: 1,500 requests/day
- **Tumhare usage**: ~7 requests per generation
- **Daily generations possible**: ~214 lead generations

**Real limit**: ~214 generations per day (Gemini ke limit se)

---

## Troubleshooting

### Error: "API key not configured"
**Solution**: Database mein keys check karo:
```sql
SELECT * FROM app_settings WHERE key IN ('groq_api_key', 'gemini_api_key');
```

### Error: "Rate limit exceeded"
**Solution**:
- Groq: 24 hours wait karo (next day reset hoga)
- Gemini: 24 hours wait karo (next day reset hoga)

### Error: "Invalid API key"
**Solution**:
- Keys ko copy-paste karte waqt extra spaces na ho
- Keys starting/ending quotes (" ") ke bina daalo
- Fresh key generate karke try karo

### Leads generate nahi ho rahe
**Solution**:
1. Browser console kholo (F12 press karo)
2. Errors check karo
3. API keys verify karo database mein

---

## Cost Breakdown

| Service | Cost | Usage Limit | Tumhare Usage |
|---------|------|-------------|---------------|
| Groq API | **₹0 FREE** | 14,400/day | ~7 per generation |
| Gemini API | **₹0 FREE** | 1,500/day | ~7 per generation |
| Supabase | **₹0 FREE** | 500MB DB | Leads storage |
| **TOTAL** | **₹0/month** | - | **214 generations/day** |

### Agar paid plan leni ho (future mein):
- **Groq Pro**: $0.05 per 1M tokens (~₹4/lakh requests)
- **Gemini Pro**: $0.002 per 1K characters (~₹0.17/1000 requests)

---

## Next Steps

1. ✅ Groq API key setup karo
2. ✅ Gemini API key setup karo
3. ✅ Database mein keys daalo
4. ✅ Test generation run karo
5. 🎯 Daily 5-10 generations chalaao
6. 💰 Hot leads ko contact karo
7. 📈 Convert leads to clients

---

## Pro Tips

1. **Daily Routine**:
   - Morning: 1 generation (7 leads)
   - Afternoon: Review & call hot leads
   - Evening: 1 generation (7 more leads)
   - Total: 14 fresh leads daily!

2. **Best Industries for Stickers**:
   - Retail stores (high volume)
   - Restaurants & cafes (frequent orders)
   - Educational institutes (branding)
   - Healthcare (labeling)

3. **Best Cities**:
   - Mumbai, Delhi, Bangalore (highest conversion)
   - Pune, Hyderabad (good volume)

4. **Lead Prioritization**:
   - 80-100 score: Call within 1 hour
   - 60-79 score: Email same day
   - 40-59 score: Follow-up next day

---

## Support

Agar koi problem aaye to:
1. Browser console check karo (F12)
2. Error message copy karo
3. Mujhe batao!

Happy Lead Generating! 🚀
