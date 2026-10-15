# Youtopia — Economic Control Room

[Play Youtopia](https://mkn-pcc.github.io/youtopia/)

A classroom economic simulator for Year 9 Business. Explore fiscal policy, pay rises and marginal tax, and public-goods contributions, then see how decisions affect a fictional country's economy. The game includes three economic conditions, undo, restart and a round review.

Open `index.html` through GitHub Pages. The JavaScript, styles, pixel artwork and fonts are all included in this repository. Progress is stored locally in the browser; the game requests no student names or accounts.

## Model boundary

Youtopia is a fictional country, not an Australian forecast. Four income cohorts represent 100,000 households each. Baseline wages are $30k/$45k/$60k/$90k; exact annual income taxes use the adult Australian resident 2026–27 bands, excluding Medicare levy and offsets. An optional $0–$1,000 rebate is a separate fictional policy.

Households spend 80% of income after tax, rebate and project contributions. Wages are reallocated from residual firm earnings; consumption from retained earnings and other demand are held fixed. Real output is `min(capacity, nominal demand)` at starting-price units; price level is `max(1, demand/capacity)`. Nominal output is always real output times price level and equals total nominal purchases. Worker equivalents use an explicit $100k real-output-per-worker assumption, not a measured unemployment rate.

The public-goods experiment uses four participants, 20 initial payoff tokens each, and `20-own+0.4*total` payoffs. These points never become cash or GDP. Each contributed token funds $100 per household in that cohort, i.e. $10m nationally. Voluntary project purchases and an equal levy-funded project with the same contribution vector produce identical macro demand. Government levy receipts and project spending are both included. Policy changes update a projected current-period budget rather than accruing another year's debt per click.

Round 1 has spare capacity. Round 2 raises other demand by $2.25bn. Round 3 retains that demand and cuts capacity by 10%. Earlier policies persist. Model notes in the app explain assumptions and link to RBA, Treasury, ATO and CORE Econ primary sources.
