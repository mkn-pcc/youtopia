# Youtopia — Economic Control Room

[Play Youtopia](https://mkn-pcc.github.io/youtopia/)

A Year 9 Business classroom simulator for government purchases, tax, pay rises and public goods.

## Teaching with Youtopia

Guided play is the default. Begin on the projector, read the short concept explanation and discuss a prediction before applying a decision. The result compares the country figures and reveals the chain of effects one step at a time. Discuss the trade-off, then reveal the example explanation when ready.

Use the question-mark buttons for metric definitions and the term buttons for contextual help. Supporting figures are hidden initially in Guided play. Explore restores the original adjustable controls; lesson reminders and explanations remain available. Each browser runs a separate country, so projector controls do not remotely control student devices. Existing saved economies are preserved.

Try fiscal spending with spare capacity, then repeat in a demand boom or supply disruption. The same spending change can affect output and prices differently. The pay-rise example retains the lesson's $45,000 to $46,000 calculation. Public-goods cases compare cooperation, free riding and compulsory funding.

The offline download includes the same teaching features, code, artwork and fonts.

## Development

The buildless runtime is at the repository root. Install the retained development dependency (`pnpm install --frozen-lockfile`), then run:

- `pnpm test` — model and DOM interaction tests, including guided predictions, reveals, storage and tax adjustments.
- `pnpm run check` — JavaScript syntax checks.
- `node scripts/export-offline.js` — refresh the self-contained offline classroom edition after edits.

See `TEACHING_NOTES.md` for source alignment and model boundaries.

## Model boundary

Youtopia is a fictional country, not an Australian forecast. Four income cohorts represent 100,000 households each. Baseline wages are $30k/$45k/$60k/$90k; exact annual income taxes use the adult Australian resident 2026–27 bands, excluding Medicare levy and offsets. An optional equal-dollar tax adjustment ranges from $1,000 extra income tax per household to a $1,000 rebate. It is separate from the Australian marginal tax bands.

Households spend 80% of income after tax, rebate and project contributions. Wages are reallocated from residual firm earnings; consumption from retained earnings and other demand are held fixed. Real output is `min(capacity, nominal demand)` at starting-price units; price level is `max(1, demand/capacity)`. Nominal output is always real output times price level and equals total nominal purchases. Worker equivalents use an explicit $100k real-output-per-worker assumption, not a measured unemployment rate.

The public-goods experiment uses four participants, 20 initial payoff tokens each, and `20-own+0.4*total` payoffs. These points never become cash or GDP. Each contributed token funds $100 per household in that cohort, i.e. $10m nationally. Voluntary project purchases and an equal levy-funded project with the same contribution vector produce identical macro demand. Government levy receipts and project spending are both included. Policy changes update a projected current-period budget rather than accruing another year's debt per click.

Round 1 has spare capacity. Round 2 raises other demand by $2.25bn. Round 3 retains that demand and cuts capacity by 10%. Earlier policies persist. Model notes in the app explain assumptions and link to RBA, Treasury, ATO and CORE Econ primary sources.
