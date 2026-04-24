export function buildDailyBrief(date = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);

  return {
    title: `${weekday} agent-first founder loop`,
    thesis: "Turn founder judgment into agent-readable work that creates revenue signal.",
    prompts: [
      {
        label: "Signal",
        text: "Point an agent at one real customer thread, call note, or buying signal."
      },
      {
        label: "Brief",
        text: "Convert the bottleneck into a crisp task with inputs, limits, and evidence required."
      },
      {
        label: "Agent",
        text: "Delegate the smallest useful move an agent can complete or prepare today."
      },
      {
        label: "Cadence",
        text: "Review the output, capture the result, and schedule the next human decision."
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
