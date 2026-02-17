# AI Lead Generation - API Setup Guide

## Overview
Lead generation system ko **3 API keys** chahiye:
- **Google Maps API** - Real business data ke liye (PAID but cheap)
- **Groq API** - Lead enrichment ke liye (FREE - 14,400 requests/day)
- **Gemini API** - Lead scoring ke liye (FREE - 1,500 requests/day)

---

## Step 1: Google Maps API Key Setup (REQUIRED - PAID)

### Kya karna hai:

#### 1.1 Google Cloud Console Setup
1. **Website kholo**: https://console.cloud.google.com
2. **Google account se login karo**
3. **Naya project banao**:
   - Top left mein project dropdown click karo
   - "New Project" click karo
   - Name do: "Lead Generation System"
   - "Create" click karo

#### 1.2 Enable Required APIs
1. **Left sidebar mein "APIs & Services" > "Library" click karo**
2. **Search karo**: "Places API"
3. **"Places API" click karke "Enable" karo**
4. **Wapas Library pe jao**
5. **Search karo**: "Places API (New)"
6. **Enable karo** (if available)

#### 1.3 Create API Key
1. **Left sidebar mein "Credentials" click karo**
2. **Top mein "+ CREATE CREDENTIALS" click karo**
3. **"API Key" select karo**
4. **Key automatically generate hogi**
5. **Copy karke safe jagah save karo**

#### 1.4 Billing Setup (REQUIRED)
1. **Left sidebar mein "Billing" click karo**
2. **"Link a billing account" click karo**
3. **Credit/Debit card details dalo**
4. **FREE $200 credit milega (3 months ke liye)**

### Google Maps Pricing:
- **Places Nearby Search**: $0.032 per request (~₹2.7)
- **Place Details**: $0.017 per request (~₹1.4)
- **Total per lead**: ~$0.049 (~₹4.1)
- **Cost for 7 leads**: ~₹28.7
- **Monthly (if 10 generations/day)**: ~₹8,610

### Cost Optimization Tips:
- Limit daily generations to 5-7
- Focus on high-converting industries
- Use $200 free credit first (lasts 2-3 months)

### Sample Key Format:
```
AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

---

## Step 2: Groq API Key Setup (FREE)

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

## Step 3: Gemini API Key Setup (FREE)

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

## Step 4: API Keys Database Mein Daalna

### Option 1: Supabase Dashboard Se (EASIEST)

1. **Supabase dashboard kholo**: https://supabase.com
2. **Apna project select karo**
3. **Left sidebar mein "SQL Editor" click karo**
4. **Niche diya gaya SQL copy-paste karo**:

```sql
-- Delete old keys if exist
DELETE FROM app_settings WHERE key IN ('google_maps_api_key', 'groq_api_key', 'gemini_api_key');

-- Insert your API keys (APNI KEYS DAALO!)
INSERT INTO app_settings (key, value) VALUES
  ('google_maps_api_key', 'YAHAN_APNI_GOOGLE_MAPS_KEY_DAALO'),
  ('groq_api_key', 'YAHAN_APNI_GROQ_KEY_DAALO'),
  ('gemini_api_key', 'YAHAN_APNI_GEMINI_KEY_DAALO');
```

5. **Apni actual keys daalo**
6. **"Run" button click karo**
7. **"Success" message aana chahiye**

---

## Step 5: Testing Karo

### Test kaise kare:

1. **Application kholo**
2. **"Lead Generation" page pe jao**
3. **Industry select karo** (e.g., "Retail")
4. **Location select karo** (e.g., "Mumbai")
5. **"Auto Generate" button click karo**
6. **Wait karo 20-30 seconds**

### Kya hoga:
1. 🗺️ **Google Maps se real businesses dhoondhega**:
   - Actual phone numbers milenge
   - Real addresses milenge
   - Google ratings milegi
   - Operating businesses only
2. 🤖 **Groq AI se har lead ko enrich karega**:
   - Sticker needs identify karega
   - Estimated order value calculate karega
   - Suggested pitch generate karega
3. 📊 **Gemini AI se har lead ko score karega**:
   - 0-100 score dega
   - Priority set karega (Hot/Warm/Cold)
   - Confidence level batayega

### Success Indicators:
✅ Leads table mein new entries aayi
✅ Har lead mein REAL phone number hai
✅ Har lead ka Google rating dikh raha hai
✅ Har lead mein AI-generated pitch dikha
✅ Har lead ka score (0-100) dikh raha hai
✅ Priority badges (Hot/Warm/Cold) dikh rahe hain
✅ No duplicate leads

---

## Daily Usage Limits

### Google Maps API:
- **Free Credit**: $200 (lasts ~2-3 months with moderate use)
- **After credit**: Pay per use (~₹4/lead)
- **Recommendation**: 5-10 generations per day max

### Groq API:
- **Free Tier**: 14,400 requests/day
- **Tumhare usage**: ~7 requests per generation
- **Daily generations possible**: ~2,000 lead generations!

### Gemini API:
- **Free Tier**: 1,500 requests/day
- **Tumhare usage**: ~7 requests per generation
- **Daily generations possible**: ~214 lead generations

**Real limit**: 5-10 generations per day (cost optimization)

---

## Available Cities (20 Major Indian Cities)

The system now supports all these cities:
- **Tier 1**: Mumbai, Delhi, Bangalore, Pune, Hyderabad, Chennai, Kolkata
- **Tier 2**: Jaipur, Ahmedabad, Lucknow, Surat, Nagpur, Indore, Bhopal
- **NCR**: Chandigarh, Gurgaon, Noida, Ghaziabad, Faridabad
- **South**: Vishakhapatnam

System automatically selects random city from your lead source configuration.

---

## Troubleshooting

### Error: "Google Maps API key not configured"
**Solution**: Database mein key check karo:
```sql
SELECT * FROM app_settings WHERE key = 'google_maps_api_key';
```

### Error: "API key not configured"
**Solution**: Database mein keys check karo:
```sql
SELECT * FROM app_settings WHERE key IN ('google_maps_api_key', 'groq_api_key', 'gemini_api_key');
```

### Error: "REQUEST_DENIED" (Google Maps)
**Solution**:
1. Google Cloud Console mein jao
2. "APIs & Services" > "Enabled APIs" check karo
3. "Places API" enabled hai ya nahi verify karo
4. Billing enabled hai ya nahi check karo

### Error: "Rate limit exceeded"
**Solution**:
- Groq: 24 hours wait karo (next day reset hoga)
- Gemini: 24 hours wait karo (next day reset hoga)
- Google Maps: Billing account check karo

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
4. Google Maps billing active hai check karo

### Duplicate leads aa rahe hain
**Solution**: System automatically duplicates detect karta hai based on:
- Google Place ID
- Phone number
- Company name
Agar phir bhi duplicates aa rahe to database check karo.

---

## Cost Breakdown

| Service | Cost | Usage Limit | Tumhare Usage | Monthly Cost |
|---------|------|-------------|---------------|--------------|
| Google Maps | **₹4/lead** | Unlimited | ~7 leads/gen | ₹840 (10 gen/day) |
| Groq API | **₹0 FREE** | 14,400/day | ~7 per generation | ₹0 |
| Gemini API | **₹0 FREE** | 1,500/day | ~7 per generation | ₹0 |
| Supabase | **₹0 FREE** | 500MB DB | Leads storage | ₹0 |
| **TOTAL** | **~₹840/month** | - | **10 generations/day** | **₹840** |

### With $200 Free Credit:
- **First 2-3 months**: Completely FREE
- **After credit exhausted**: ~₹840/month

---

## Pro Tips

1. **Daily Routine**:
   - Morning: 1 generation (7 leads with REAL phone numbers)
   - Review leads & prioritize hot ones
   - Afternoon: Call top 3-5 hot leads
   - Evening: 1 generation (7 more leads)
   - Total: 14 verified leads daily!

2. **Best Industries for Stickers**:
   - Retail stores (high volume orders)
   - Restaurants & cafes (frequent repeat orders)
   - Educational institutes (branding needs)
   - Healthcare (safety labels)
   - Manufacturing (product labels)

3. **Best Cities**:
   - Mumbai, Delhi, Bangalore (highest conversion)
   - Pune, Hyderabad (good volume)
   - Ahmedabad, Surat (manufacturing hub)

4. **Lead Prioritization**:
   - 80-100 score: Call within 1 hour
   - 60-79 score: Email same day
   - 40-59 score: Follow-up next day
   - <40 score: Nurture campaign

5. **Quality Over Quantity**:
   - Focus on hot leads only (80+ score)
   - 5 quality leads > 50 average leads
   - All leads have REAL phone numbers from Google
   - No fake or generated contacts

6. **Cost Optimization**:
   - Use free $200 credit wisely
   - Generate leads for 2-3 cities only
   - Focus on high-converting industries
   - Don't over-generate

---

## New Features

### 1. Real Business Data
- All phone numbers are REAL (from Google Maps)
- No AI-generated fake contacts
- Verified business addresses
- Google ratings included
- Operating businesses only

### 2. Smart Deduplication
- Checks Google Place ID
- Checks phone numbers (normalized)
- Checks company names (case-insensitive)
- No duplicate leads in your database

### 3. Comprehensive Coverage
- 20 major Indian cities supported
- Auto-rotation of cities
- Industry-specific search
- Multiple search types per industry

### 4. Better Error Handling
- Automatic retries (3 attempts)
- Exponential backoff
- Graceful failures
- Detailed error messages

### 5. Cost Tracking
- API call counts logged
- Success rate tracking
- Duration monitoring
- Generation history

---

## Next Steps

1. ✅ Google Maps API key setup karo (with billing)
2. ✅ Groq API key setup karo
3. ✅ Gemini API key setup karo
4. ✅ Database mein keys daalo
5. ✅ Test generation run karo
6. 🎯 Daily 5-10 generations chalaao
7. 💰 Hot leads ko contact karo
8. 📈 Convert leads to clients

---

## Support

Agar koi problem aaye to:
1. Browser console check karo (F12)
2. Error message copy karo
3. Google Cloud Console mein billing check karo
4. API keys verify karo database mein

Happy Lead Generating with REAL verified data! 🚀
