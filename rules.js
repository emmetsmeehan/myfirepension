/* The pension rule numbers for myfirepension.com AND the iPhone app. Edit numbers here, nowhere else.
   The site loads this file on every calculator page. The app downloads https://myfirepension.com/rules.js at launch
   and reads everything after the last "window.RULES =" (minus the final semicolon) as JSON, so keep that part strict JSON:
   double quotes, no comments, no trailing commas, null for "no limit". tests/run.mjs checks this.
   After any change: run the test cases (node tests/run.mjs) and fix any wording on the pages that quotes the number. */
window.RULES = {
  "version": "2026-11-07",
  "shared": {
    "vsfPerYear": 12000,
    "vsfSource": "Variable Supplements Fund, max $12,000 since 2008 (Fire Pension Fund ACFR FY2025)",
    "longevityBonus": {"startYears": 25, "startPct": 0.05, "perYearPct": 0.01, "maxPct": 0.15},
    "longevityBonusSource": "Admin Code 15-110.1, FY2027 budget (S9008-C/A10008-C Part AAA), signed May 27, 2026",
    "cola": {"firstDollars": 18000, "minRate": 0.01, "maxRate": 0.03},
    "rankTopPay": {
      "FF": 109352, "LT": 140212, "CAPT": 160941, "BC": 209563, "DC": 232278,
      "WIPER": 113336, "PILOT": 135807, "MEU": 120599, "MEL": 132307,
      "FM": 122474, "SFM1": 153332, "SFM2": 202252
    },
    "rankTopPaySource": "Top-step base pay: UFA schedules Aug. 1, 2024 (FF, FM, wipers) and July 28, 2025 (pilots, marine engineers); UFOA schedule July 31, 2025",
    "federalTax": {
      "year": 2026,
      "source": "IRS Rev. Proc. 2025-32",
      "marriedJoint": {"standardDeduction": 32200, "brackets": [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [null, 0.37]]},
      "single": {"standardDeduction": 16100, "brackets": [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [null, 0.37]]}
    }
  },
  "tier3": {
    "pensionPct": 0.5,
    "pensionSource": "S4727, Chapter 692 of 2025: 50% at 20 years",
    "disabilityPct": 0.75,
    "fasCapPct": 1.10,
    "fasSource": "Best 3 years, each capped at 110% of the two before (owner's decision; Tier 3 Enhanced SPD)",
    "fullEscalationYears": 23,
    "escalationRampMonths": 36,
    "escalationMaxRate": 0.03,
    "escalationSource": "RSSL 510(b)(2-a), FY2027 budget Part ZZ: full at 23 years, 1/36 less per month earlier",
    "socialSecurityOffsetPct": 0.5,
    "ssOffsetEstimate": {
      "source": "RSSL 511 (Tier 3 offset: public-employer wages only, zeros otherwise, lower of the (c)(1) and (c)(2) computations, cut 5/9 of 1% a month before 65, at most 20%); SSA PIA formula and bend points for 2026; SSA contribution and benefit base by year",
      "bendPoints": [1286, 7749],
      "pct": [0.90, 0.32, 0.15],
      "computationYears": 35,
      "firstAge": 22,
      "lastAge": 61,
      "altCutPerYear": 0.05,
      "earlyCut": 0.20,
      "wageBase": {"2009": 106800, "2010": 106800, "2011": 106800, "2012": 110100, "2013": 113700, "2014": 117000, "2015": 118500, "2016": 118500, "2017": 127200, "2018": 128400, "2019": 132900, "2020": 137700, "2021": 142800, "2022": 147000, "2023": 160200, "2024": 168600, "2025": 176100, "2026": 184500}
    },
    "mandatoryRetirementAge": 62,
    "mandatoryRetirementSource": "RSSL 501(15)",
    "vestingYears": 5,
    "vestedPctPerYear": 0.021,
    "vestedRefundUntilYears": 10,
    "vestedSource": "RSSL 516; Tier 3 Enhanced SPD (Dec. 2019) p. 13-14: 2.1% of FAS per year, from 5 years; refund instead only under 10 years"
  },
  "tier2": {
    "pensionPct": 0.5,
    "disabilityPct": 0.75,
    "afterTwentyDivisor": 60,
    "fasCapPct": 1.20,
    "fasSource": "Tiers 1 & 2 SPD (Sept. 2014); Chapter 540 of 2021",
    "ithp": {"cityRate": 0.05, "creditRate": 0.0825, "estimatePayoutRate": 0.07, "estimatePayoutToAge": 85},
    "ithpSource": "City pays 5%, credited 8.25% (ACFR FY2025). The 7% payout to age 85 is the site's own rough estimate.",
    "mandatoryRetirementAge": 65,
    "mandatoryRetirementSource": "Admin Code 15-121",
    "vestingYears": 5,
    "vestedFractionPerYear": 0.025,
    "vestedSource": "Tiers 1 & 2 SPD (Sept. 2014) p. 27: 1/40th of FAS per year of fire service, no longevity, from 5 years, paid from the would-be 20-year date; no VSF (p. 35)"
  }
};
