export function buildDailyBrief(date = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);

  return {
    title: `${weekday} founder loop`,
    thesis: "Make one clear move from signal to revenue.",
    prompts: [
      {
        label: "Signal",
        text: "Talk to one real customer or study one real buying signal."
      },
      {
        label: "Constraint",
        text: "Name the one bottleneck blocking revenue, shipping, or learning."
      },
      {
        label: "Move",
        text: "Ship the smallest useful action that tests the constraint."
      },
      {
        label: "Cadence",
        text: "Write down the result, next owner, and next review time."
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
