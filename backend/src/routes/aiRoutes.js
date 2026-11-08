import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

router.post('/analyze', async (req, res) => {
  const { 
    currentCash = 1000000, 
    monthlyBurn = 75000, 
    runwayMonths = 12, 
    hiringMultiplier = 100, 
    marketingMultiplier = 100,
    growthEfficiency = 15,
    currency = 'USD'
  } = req.body || {};

  const currSymbol = currency === 'INR' ? '₹' : '$';
  const formatVal = (v) => `${currSymbol}${Math.round(Number(v) || 0).toLocaleString()}`;

  // Deterministic enterprise heuristic engine (activates if no Gemini API key or on API failure)
  const heuristicInsight = () => {
    let diagnosis = [];
    const cashStr = formatVal(currentCash);
    const burnStr = formatVal(monthlyBurn);

    if (runwayMonths < 6) {
      diagnosis.push(`🚨 CRITICAL DEFICIT DIAGNOSIS: At the current burn velocity of ${burnStr}/month against total liquidity of ${cashStr}, your enterprise faces solvency exhaustion within ${runwayMonths} month(s). Immediate structural intervention is required to avoid insolvency.`);
      diagnosis.push(`EXECUTIVE ACTION PLAN:
1. Liquidity Lockdown: Enforce an immediate freeze on uncommitted engineering requisitions, decreasing hiring scale from ${hiringMultiplier}% to 70% to conserve capital immediately.
2. Demand Pacing: Trim underperforming acquisition spend (reduce marketing scale from ${marketingMultiplier}% down to 65%) and initiate an emergency insider bridge round or non-dilutive credit facility before Month 2.`);
    } else if (runwayMonths < 10) {
      diagnosis.push(`⚠️ MODERATE RESERVE DIAGNOSIS: Current reserves of ${cashStr} afford a manageable ${runwayMonths}-month operational cushion under a net burn of ${burnStr}/month. Capital velocity is sustainable, but vulnerable to unexpected churn or macro contraction.`);
      diagnosis.push(`EXECUTIVE ACTION PLAN:
1. Capital Preservation: Cap hiring overhead at neutral 100% and restructure customer onboarding to compress payback cycles below 6 months.
2. Milestone Advancement: Target closing your next funding tranche or revenue milestone at least 3 months ahead of your projected zero-cash horizon.`);
    } else {
      diagnosis.push(`✅ RESILIENT RUNWAY DIAGNOSIS: Outstanding capital resilience. Reserves of ${cashStr} and terminal monthly burn of ${burnStr} sustain operations for ${runwayMonths}+ months, providing superior strategic runway to execute aggressive market expansion.`);
      diagnosis.push(`EXECUTIVE ACTION PLAN:
1. Offensive Engineering: Safely expand core engineering capacity up to ${Math.min(150, Math.round(hiringMultiplier * 1.15))}% to accelerate platform defensibility and core moat.
2. Acquisition Acceleration: Deploy capital into high-margin conversion channels to elevate organic recurring ARR while CAC efficiency yields remain above ${((growthEfficiency || 15) / 10).toFixed(1)}%.`);
    }

    return diagnosis.join('\n\n');
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const prompt = `You are an elite Silicon Valley venture CFO and corporate restructuring advisor.
Analyze this startup's operational runway telemetry:
- Treasury Cash Reserve: ${formatVal(currentCash)}
- Terminal Monthly Net Burn: ${formatVal(monthlyBurn)}
- Algorithmic Runway Duration: ${runwayMonths} months
- Headcount / Payroll Multiplier: ${hiringMultiplier}%
- Marketing / Growth Multiplier: ${marketingMultiplier}%
- CAC Efficiency Yield: ${((growthEfficiency || 15) / 10).toFixed(1)}%

Provide:
1. A concise, hard-hitting financial diagnosis paragraph evaluating default vulnerability, burn pacing, and capital health.
2. Exactly two concrete, aggressive, numbered strategic action points tailored to their runway duration.
Keep the style executive, authoritative, and data-driven. Do not provide disclaimers or fluff.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      if (response && response.text) {
        return res.json({ 
          insight: response.text, 
          engine: 'gemini-2.5-flash',
          status: 'success'
        });
      }
    }

    return res.json({ 
      insight: heuristicInsight(), 
      engine: 'autonomous-heuristic-cfo',
      status: 'success'
    });
  } catch (err) {
    console.error('AI Analysis Gateway Error:', err.message || err);
    return res.json({ 
      insight: heuristicInsight(), 
      engine: 'heuristic-engine-fallback',
      status: 'fallback'
    });
  }
});

export default router;
