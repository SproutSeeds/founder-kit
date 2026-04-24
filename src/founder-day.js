export function buildDailyBrief(date = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);

  return {
    title: `${weekday} agent-first compliance loop`,
    thesis: "Turn founder intent into official-source tasks, evidence, and renewal cadence.",
    prompts: [
      {
        label: "Profile",
        text: "Confirm entity, activity, state, county, city, and business-location facts."
      },
      {
        label: "Scout",
        text: "Check state maintenance, county/city licensing, zoning, tax, and regulated permits."
      },
      {
        label: "Binder",
        text: "Save official URLs, filings, receipt numbers, agency notes, and renewal dates."
      },
      {
        label: "Cadence",
        text: "Review unresolved questions and schedule the next required founder decision."
      }
    ]
  };
}

export function formatDailyBrief(brief = buildDailyBrief()) {
  const lines = [
    "",
    brief.title,
    brief.thesis,
    ""
  ];

  brief.prompts.forEach((prompt, index) => {
    lines.push(`${index + 1}. ${prompt.label}: ${prompt.text}`);
  });

  lines.push("");
  lines.push("Run `founder --help` for options.");

  return lines.join("\n");
}
