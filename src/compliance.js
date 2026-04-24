const LEGAL_NOTICE = "Founder Kit is an evidence organizer, not legal, tax, zoning, or licensing advice. Verify every action with the official agency or a qualified professional.";

export const OFFICIAL_SOURCES = {
  sbaLicenses: "https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits",
  sbaLocation: "https://www.sba.gov/business-guide/launch-your-business/pick-your-business-location",
  sbaRegister: "https://www.sba.gov/business-guide/launch-your-business/register-your-business",
  irsEin: "https://www.irs.gov/businesses/small-businesses-self-employed/employer-id-numbers",
  fincenBoi: "https://www.fincen.gov/boi"
};

const STATE_HINTS = {
  FL: {
    name: "Florida",
    secretaryOfState: "https://dos.myflorida.com/sunbiz/",
    revenue: "https://floridarevenue.com/",
    localLicenseTerm: "business tax receipt"
  },
  CA: {
    name: "California",
    secretaryOfState: "https://bizfileonline.sos.ca.gov/",
    revenue: "https://www.cdtfa.ca.gov/",
    localLicenseTerm: "business license"
  },
  DE: {
    name: "Delaware",
    secretaryOfState: "https://corp.delaware.gov/",
    revenue: "https://revenue.delaware.gov/",
    localLicenseTerm: "business license"
  },
  NY: {
    name: "New York",
    secretaryOfState: "https://dos.ny.gov/division-corporations",
    revenue: "https://www.tax.ny.gov/",
    localLicenseTerm: "business license"
  },
  TX: {
    name: "Texas",
    secretaryOfState: "https://www.sos.state.tx.us/corp/",
    revenue: "https://comptroller.texas.gov/",
    localLicenseTerm: "business license"
  }
};

const REGULATED_ACTIVITY_RULES = [
  { key: "alcohol", pattern: /\b(alcohol|bar|beer|wine|liquor|brewery|distillery)\b/i, label: "alcohol" },
  { key: "childcare", pattern: /\b(childcare|daycare|children|preschool)\b/i, label: "childcare" },
  { key: "construction", pattern: /\b(contractor|construction|electrical|plumbing|roofing|hvac)\b/i, label: "construction" },
  { key: "events", pattern: /\b(event|venue|festival|market|popup|pop-up)\b/i, label: "events" },
  { key: "food", pattern: /\b(food|restaurant|catering|bakery|coffee|truck|kitchen)\b/i, label: "food" },
  { key: "health", pattern: /\b(health|medical|clinic|therapy|wellness|salon|cosmetic)\b/i, label: "health or personal services" },
  { key: "professional", pattern: /\b(legal|accounting|architect|engineer|real estate|insurance)\b/i, label: "professional services" },
  { key: "retail", pattern: /\b(retail|store|shop|boutique|resale|ecommerce|e-commerce)\b/i, label: "retail" },
  { key: "transport", pattern: /\b(transport|delivery|courier|moving|freight|vehicle)\b/i, label: "transportation" }
];

function clean(value) {
  if (value === undefined || value === null) return null;
  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : null;
}

function bool(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value;
  if (["1", "true", "yes", "y", "on"].includes(String(value).toLowerCase())) return true;
  if (["0", "false", "no", "n", "off"].includes(String(value).toLowerCase())) return false;
  return null;
}

function pickBool(input, keys, fallback) {
  for (const key of keys) {
    if (Object.hasOwn(input, key)) return bool(input[key]);
  }
  return fallback;
}

function list(value) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (!clean(value)) return [];
  return String(value)
    .split(",")
    .map(clean)
    .filter(Boolean);
}

function stateCode(value) {
  const cleaned = clean(value);
  if (!cleaned) return null;
  return cleaned.length === 2 ? cleaned.toUpperCase() : cleaned;
}

function todayIso(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function getStateHint(profile) {
  const code = stateCode(profile?.location?.state || profile?.business?.formationState);
  return STATE_HINTS[code] ?? null;
}

function sourceQuery(value) {
  return value.replace(/\s+/g, " ").trim();
}

function jurisdictionLabel(profile) {
  const location = profile.location ?? {};
  return [
    location.city,
    location.county ? `${location.county} County` : null,
    location.state
  ].filter(Boolean).join(", ") || "unknown jurisdiction";
}

function activityLabel(profile) {
  return profile.business?.activity || "the planned business activity";
}

export function createFounderProfile(input = {}, existing = {}, options = {}) {
  const now = options.now ?? new Date();
  const previous = existing && typeof existing === "object" ? existing : {};
  const business = previous.business ?? {};
  const location = previous.location ?? {};

  return {
    version: 1,
    createdAt: previous.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
    business: {
      name: clean(input.name) ?? business.name ?? null,
      entityType: clean(input.entity || input.entityType) ?? business.entityType ?? null,
      formationState: stateCode(input["formation-state"] || input.formationState) ?? business.formationState ?? null,
      acquiringExistingEntity: pickBool(input, ["buying", "acquiringExistingEntity"], business.acquiringExistingEntity ?? false),
      activity: clean(input.activity) ?? business.activity ?? null,
      naics: clean(input.naics) ?? business.naics ?? null,
      regulatedActivities: [
        ...new Set([
          ...list(business.regulatedActivities),
          ...list(input.regulated || input.regulatedActivities)
        ])
      ]
    },
    location: {
      state: stateCode(input.state) ?? location.state ?? null,
      county: clean(input.county) ?? location.county ?? null,
      city: clean(input.city) ?? location.city ?? null,
      address: clean(input.address || input.location) ?? location.address ?? null,
      addressType: clean(input["address-type"] || input.addressType) ?? location.addressType ?? null,
      insideCityLimits: pickBool(input, ["inside-city-limits", "insideCityLimits"], location.insideCityLimits ?? null),
      homeBased: pickBool(input, ["home-based", "homeBased"], location.homeBased ?? null)
    },
    evidence: Array.isArray(previous.evidence) ? previous.evidence : []
  };
}

export function missingProfileFields(profile = {}) {
  const missing = [];
  if (!profile.business?.name) missing.push("business name");
  if (!profile.business?.entityType) missing.push("entity type");
  if (!profile.business?.formationState) missing.push("formation state");
  if (!profile.business?.activity) missing.push("business activity");
  if (!profile.location?.state) missing.push("operating state");
  if (!profile.location?.county) missing.push("county");
  if (!profile.location?.city && profile.location?.insideCityLimits !== false) missing.push("city or unincorporated status");
  if (!profile.location?.addressType) missing.push("address type");
  if (profile.location?.insideCityLimits === null || profile.location?.insideCityLimits === undefined) missing.push("inside city limits");
  return missing;
}

export function detectRegulatedActivities(profile = {}) {
  const text = [
    profile.business?.activity,
    profile.business?.naics,
    ...(profile.business?.regulatedActivities ?? [])
  ].filter(Boolean).join(" ");
  const detected = REGULATED_ACTIVITY_RULES
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => rule.label);
  return [...new Set([...detected, ...(profile.business?.regulatedActivities ?? [])])];
}

function item(id, title, values = {}) {
  return {
    id,
    title,
    status: values.status ?? "todo",
    jurisdiction: values.jurisdiction ?? "business",
    why: values.why,
    agentTask: values.agentTask,
    evidenceNeeded: values.evidenceNeeded ?? [],
    officialSources: values.officialSources ?? [],
    sourceQueries: values.sourceQueries ?? [],
    renewal: values.renewal ?? null
  };
}

export function buildComplianceChecklist(profile = createFounderProfile(), options = {}) {
  const generatedAt = todayIso(options.now ?? new Date());
  const stateHint = getStateHint(profile);
  const localLicenseTerm = stateHint?.localLicenseTerm ?? "business license or local tax certificate";
  const jurisdiction = jurisdictionLabel(profile);
  const activity = activityLabel(profile);
  const missing = missingProfileFields(profile);
  const regulated = detectRegulatedActivities(profile);
  const state = profile.location?.state || profile.business?.formationState || "your state";
  const county = profile.location?.county || "your county";
  const city = profile.location?.city || "your city";

  const checklist = [
    item("profile.complete", "Complete the operating profile", {
      status: missing.length ? "needs-info" : "ready",
      jurisdiction,
      why: "Every local license and zoning check depends on the exact activity and operating location.",
      agentTask: missing.length
        ? `Ask the founder for: ${missing.join(", ")}.`
        : "Use the stored profile as the input record for all agency checks.",
      evidenceNeeded: ["Business profile JSON", "Address or operating-location notes"]
    }),
    item("entity.good-standing", "Confirm entity registration and good standing", {
      jurisdiction: profile.business?.formationState || state,
      why: "The business must exist and stay maintainable before local permits or tax accounts are reliable.",
      agentTask: `Check the Secretary of State record for ${profile.business?.name || "the entity"} and capture status, registered agent, annual-report due date, and filing number.`,
      officialSources: [stateHint?.secretaryOfState, OFFICIAL_SOURCES.sbaRegister].filter(Boolean),
      sourceQueries: [sourceQuery(`${profile.business?.formationState || state} secretary of state business search annual report official`)],
      evidenceNeeded: ["Good-standing screenshot or certificate", "Registered agent details", "Annual report deadline"],
      renewal: { cadence: "annual", label: "State annual report or franchise filing" }
    }),
    item("tax.ein-state", "Confirm EIN and state tax accounts", {
      jurisdiction: state,
      why: "Payroll, sales tax, reseller certificates, and bank onboarding often depend on EIN and state tax registrations.",
      agentTask: `Determine whether ${activity} needs sales/use tax, employer withholding, resale, lodging, communications, or other state tax accounts.`,
      officialSources: [OFFICIAL_SOURCES.irsEin, stateHint?.revenue].filter(Boolean),
      sourceQueries: [sourceQuery(`${state} department of revenue business tax registration ${activity} official`)],
      evidenceNeeded: ["EIN confirmation letter or note", "State tax registration IDs", "Filing frequency"]
    }),
    item("county.local-license", `Check county ${localLicenseTerm}`, {
      jurisdiction: `${county} County`,
      why: "Many counties require a local receipt, license, or tax account even when a city also licenses the business.",
      agentTask: `Find the official ${county} County ${localLicenseTerm} page for ${activity}; capture application steps, fees, renewal month, and whether zoning approval is required first.`,
      sourceQueries: [sourceQuery(`${county} County ${state} ${localLicenseTerm} ${activity} official`)],
      evidenceNeeded: ["County application URL", "Fee schedule", "Receipt/license number", "Renewal deadline"],
      renewal: { cadence: "annual", label: `County ${localLicenseTerm}` }
    }),
    item("city.local-license", `Check city ${localLicenseTerm}`, {
      status: profile.location?.insideCityLimits === false ? "verify-unincorporated" : "todo",
      jurisdiction: city,
      why: "Businesses inside city limits often need city approval before, or in addition to, county registration.",
      agentTask: profile.location?.insideCityLimits === false
        ? `Verify the address is outside municipal limits; if true, document that ${county} County is the local licensing authority.`
        : `Find the official ${city} ${localLicenseTerm} page for ${activity}; capture required zoning, inspections, fees, and renewal dates.`,
      sourceQueries: [sourceQuery(`${city} ${state} ${localLicenseTerm} zoning ${activity} official`)],
      evidenceNeeded: ["City limits confirmation", "City application URL", "License/receipt number or written not-required evidence"],
      renewal: profile.location?.insideCityLimits === false ? null : { cadence: "annual", label: `City ${localLicenseTerm}` }
    }),
    item("zoning.allowed-use", "Verify allowed use at the business location", {
      jurisdiction,
      why: "A business can be registered with the state but still be prohibited at a specific address by zoning, lease, HOA, or home-occupation rules.",
      agentTask: `Ask planning/zoning whether ${activity} is allowed at ${profile.location?.address || "the chosen address"}; capture conditions, prohibited uses, inspections, and sign limits.`,
      officialSources: [OFFICIAL_SOURCES.sbaLocation],
      sourceQueries: [sourceQuery(`${city} ${state} zoning allowed use ${activity} ${profile.location?.addressType || ""} official`)],
      evidenceNeeded: ["Zoning approval", "Allowed-use email or letter", "Home occupation permit if applicable"]
    }),
    item("dba.fictitious-name", "Check DBA or fictitious-name requirements", {
      jurisdiction: state,
      why: "Operating under a name different from the legal entity can require state, county, or newspaper notice filings.",
      agentTask: "Compare the public business name against the legal entity name and determine whether a DBA/fictitious-name filing is required.",
      sourceQueries: [sourceQuery(`${state} DBA fictitious name registration official`)],
      evidenceNeeded: ["DBA filing record", "Publication proof if required", "Not-required note"]
    }),
    item("regulated.activity-permits", "Identify regulated activity permits", {
      status: regulated.length ? "todo" : "watch",
      jurisdiction,
      why: "Food, alcohol, childcare, construction, health, transport, professional, and event businesses often need specialized permits.",
      agentTask: regulated.length
        ? `For ${regulated.join(", ")}, find the state, county, and city agencies that regulate ${activity}.`
        : `Classify whether ${activity} touches a regulated category before launch.`,
      officialSources: [OFFICIAL_SOURCES.sbaLicenses],
      sourceQueries: regulated.map((label) => sourceQuery(`${state} ${label} business permit ${activity} official`)),
      evidenceNeeded: ["Regulated-agency list", "Permit applications", "Inspection requirements", "Professional license status"]
    }),
    item("binder.evidence", "Build the evidence binder", {
      jurisdiction: "operations",
      why: "Agents and founders need a durable record of official URLs, dates, permit numbers, and renewal obligations.",
      agentTask: "Add every official source, filing, receipt, permit, and agency email to `founder binder` with renewal dates where known.",
      evidenceNeeded: ["Official URLs", "Filing PDFs", "Permit numbers", "Renewal dates", "Agency contacts"]
    })
  ];

  if (profile.location?.homeBased === true) {
    checklist.splice(5, 0, item("home-occupation", "Check home-occupation rules", {
      jurisdiction,
      why: "Home-based businesses can face limits on visitors, employees, inventory, signage, deliveries, noise, and hazardous materials.",
      agentTask: `Find home-occupation rules for ${city || county}, ${state}; confirm ${activity} is allowed from home.`,
      sourceQueries: [sourceQuery(`${city || county} ${state} home occupation permit ${activity} official`)],
      evidenceNeeded: ["Home occupation permit", "Lease/HOA permission if applicable", "Written allowed-use note"]
    }));
  }

  return {
    type: "founder-kit.compliance-checklist",
    generatedAt,
    legalNotice: LEGAL_NOTICE,
    profileSummary: {
      business: profile.business?.name || "Unnamed business",
      activity,
      entityType: profile.business?.entityType || "unknown entity",
      jurisdiction,
      acquiringExistingEntity: Boolean(profile.business?.acquiringExistingEntity)
    },
    missing,
    regulatedActivities: regulated,
    checklist,
    sourceQueries: [
      sourceQuery(`${state} secretary of state ${profile.business?.entityType || "business"} official`),
      sourceQuery(`${county} County ${state} business license business tax receipt official`),
      sourceQuery(`${city} ${state} zoning ${activity} official`)
    ]
  };
}

export function buildAcquisitionChecklist(profile = createFounderProfile(), options = {}) {
  const generatedAt = todayIso(options.now ?? new Date());
  const state = profile.business?.formationState || profile.location?.state || "formation state";
  const county = profile.location?.county || "county";
  const city = profile.location?.city || "city";
  const activity = activityLabel(profile);

  return {
    type: "founder-kit.llc-acquisition-checklist",
    generatedAt,
    legalNotice: LEGAL_NOTICE,
    profileSummary: {
      business: profile.business?.name || "Target LLC",
      activity,
      jurisdiction: jurisdictionLabel(profile)
    },
    checklist: [
      item("acquire.good-standing", "Confirm good standing and authority to sell", {
        jurisdiction: state,
        agentTask: "Pull the entity record, annual reports, registered agent history, managers/members if public, and any delinquency notes.",
        sourceQueries: [sourceQuery(`${state} secretary of state LLC good standing official`)],
        evidenceNeeded: ["Entity record", "Certificate of status", "Seller authority documents"]
      }),
      item("acquire.liabilities", "Review debts, taxes, liens, lawsuits, and contracts", {
        jurisdiction: "diligence",
        agentTask: "Build a diligence request list for tax returns, sales tax filings, payroll, leases, vendor contracts, loans, liens, litigation, and customer obligations.",
        evidenceNeeded: ["Tax clearance if available", "Lien search", "Contract schedule", "Debt schedule"]
      }),
      item("acquire.licenses-transfer", "Verify whether local licenses and permits transfer", {
        jurisdiction: `${city}, ${county} County`,
        agentTask: `Ask city/county licensing whether ${activity} receipts, permits, inspections, and zoning approvals survive an ownership change.`,
        sourceQueries: [sourceQuery(`${city} ${state} business license ownership change transfer official`), sourceQuery(`${county} County ${state} business tax receipt transfer official`)],
        evidenceNeeded: ["Transfer approval", "New application requirement", "Inspection notes"]
      }),
      item("acquire.ein-bank", "Plan EIN, bank, payroll, and payment account transition", {
        jurisdiction: "tax and finance",
        officialSources: [OFFICIAL_SOURCES.irsEin],
        agentTask: "Confirm whether the transaction structure requires a new EIN and list every bank, processor, marketplace, payroll, and tax account that must change control.",
        evidenceNeeded: ["EIN determination", "Bank resolution", "Processor transfer checklist"]
      }),
      item("acquire.closing", "Prepare assignment and post-closing maintenance", {
        jurisdiction: "closing",
        agentTask: "Track operating agreement amendments, membership interest assignment, bill of sale if assets move, registered agent updates, annual report updates, and renewal calendar handoff.",
        evidenceNeeded: ["Signed transfer documents", "Updated company records", "Renewal calendar"]
      })
    ]
  };
}

export function addEvidence(profile, input = {}, options = {}) {
  const now = options.now ?? new Date();
  const evidence = {
    id: `ev_${now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}_${(profile.evidence?.length ?? 0) + 1}`,
    label: clean(input.label || input._text) ?? "Untitled evidence",
    type: clean(input.type) ?? "source",
    jurisdiction: clean(input.jurisdiction) ?? null,
    url: clean(input.url) ?? null,
    note: clean(input.note) ?? null,
    renewalDate: clean(input.renewal || input["renewal-date"] || input.renewalDate) ?? null,
    verifiedAt: clean(input.verified || input["verified-at"] || input.verifiedAt) ?? todayIso(now),
    createdAt: now.toISOString()
  };

  return {
    ...profile,
    updatedAt: now.toISOString(),
    evidence: [...(profile.evidence ?? []), evidence]
  };
}

export function buildRenewalCalendar(profile = createFounderProfile(), options = {}) {
  const generatedAt = todayIso(options.now ?? new Date());
  const stateHint = getStateHint(profile);
  const localLicenseTerm = stateHint?.localLicenseTerm ?? "business license or local tax certificate";
  const state = profile.business?.formationState || profile.location?.state || "state";
  const county = profile.location?.county || "county";
  const city = profile.location?.city || "city";
  const evidenceRenewals = (profile.evidence ?? [])
    .filter((entry) => entry.renewalDate)
    .map((entry) => ({
      label: entry.label,
      due: entry.renewalDate,
      source: entry.url,
      jurisdiction: entry.jurisdiction,
      evidenceId: entry.id
    }));

  return {
    type: "founder-kit.renewal-calendar",
    generatedAt,
    legalNotice: LEGAL_NOTICE,
    renewals: [
      {
        label: "State annual report or franchise filing",
        due: "Confirm with state",
        jurisdiction: state,
        source: stateHint?.secretaryOfState ?? null
      },
      {
        label: `County ${localLicenseTerm}`,
        due: "Confirm with county",
        jurisdiction: `${county} County`,
        source: null
      },
      {
        label: `City ${localLicenseTerm}`,
        due: profile.location?.insideCityLimits === false ? "Usually not applicable if unincorporated; verify" : "Confirm with city",
        jurisdiction: city,
        source: null
      },
      {
        label: "Registered agent and company records review",
        due: "Quarterly",
        jurisdiction: state,
        source: null
      },
      ...evidenceRenewals
    ]
  };
}

function appendItemMeta(lines, entry) {
  const sources = entry.officialSources?.filter(Boolean) ?? [];
  const queries = entry.sourceQueries?.filter(Boolean) ?? [];

  if (sources.length) lines.push(`   Sources: ${sources.join(", ")}`);
  if (queries.length) lines.push(`   Search: ${queries.join(" | ")}`);
}

export function formatComplianceChecklist(result) {
  const lines = [
    "",
    "Founder Kit compliance scout",
    result.profileSummary.business,
    `${result.profileSummary.entityType} | ${result.profileSummary.activity} | ${result.profileSummary.jurisdiction}`,
    "",
    result.legalNotice
  ];

  if (result.missing.length) {
    lines.push("");
    lines.push(`Missing profile fields: ${result.missing.join(", ")}`);
  }

  lines.push("");
  result.checklist.forEach((entry, index) => {
    lines.push(`${index + 1}. [${entry.status}] ${entry.title}`);
    lines.push(`   ${entry.agentTask}`);
    if (entry.evidenceNeeded.length) lines.push(`   Evidence: ${entry.evidenceNeeded.join("; ")}`);
    appendItemMeta(lines, entry);
  });

  return lines.join("\n");
}

export function formatAcquisitionChecklist(result) {
  const lines = [
    "",
    "Founder Kit buy-LLC scout",
    `${result.profileSummary.business} | ${result.profileSummary.activity} | ${result.profileSummary.jurisdiction}`,
    "",
    result.legalNotice,
    ""
  ];

  result.checklist.forEach((entry, index) => {
    lines.push(`${index + 1}. ${entry.title}`);
    lines.push(`   ${entry.agentTask}`);
    if (entry.evidenceNeeded.length) lines.push(`   Evidence: ${entry.evidenceNeeded.join("; ")}`);
    appendItemMeta(lines, entry);
  });

  return lines.join("\n");
}

export function formatEvidenceBinder(profile = createFounderProfile()) {
  const evidence = profile.evidence ?? [];
  const lines = ["", "Founder Kit evidence binder"];

  if (!evidence.length) {
    lines.push("No evidence saved yet.");
    lines.push("Add one with: founder binder add --label \"County BTR\" --url https://...");
    return lines.join("\n");
  }

  evidence.forEach((entry, index) => {
    lines.push(`${index + 1}. ${entry.label} (${entry.type})`);
    if (entry.jurisdiction) lines.push(`   Jurisdiction: ${entry.jurisdiction}`);
    if (entry.url) lines.push(`   URL: ${entry.url}`);
    if (entry.renewalDate) lines.push(`   Renewal: ${entry.renewalDate}`);
    if (entry.note) lines.push(`   Note: ${entry.note}`);
    lines.push(`   Verified: ${entry.verifiedAt}`);
  });

  return lines.join("\n");
}

export function formatRenewalCalendar(result) {
  const lines = ["", "Founder Kit renewal calendar", result.legalNotice, ""];

  result.renewals.forEach((entry, index) => {
    lines.push(`${index + 1}. ${entry.label}`);
    lines.push(`   Due: ${entry.due}`);
    lines.push(`   Jurisdiction: ${entry.jurisdiction || "n/a"}`);
    if (entry.source) lines.push(`   Source: ${entry.source}`);
  });

  return lines.join("\n");
}

export function formatInitResult(profile, statePath) {
  const missing = missingProfileFields(profile);
  const lines = [
    "",
    "Founder Kit profile saved",
    statePath,
    "",
    `${profile.business.name || "Unnamed business"} | ${profile.business.entityType || "unknown entity"} | ${jurisdictionLabel(profile)}`
  ];

  if (missing.length) {
    lines.push("");
    lines.push(`Still needed: ${missing.join(", ")}`);
  }

  lines.push("");
  lines.push("Next: founder scout");
  return lines.join("\n");
}
