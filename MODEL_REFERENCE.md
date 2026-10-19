# Australian reference and model boundaries

Checked 20 October 2026. This is a conceptual audit of the teaching model, not empirical calibration or validation as an Australian forecasting model.

## What the game takes from Australian sources

| Feature | Basis | Implementation |
| --- | --- | --- |
| Progressive personal income tax | Australian adult resident 2026–27 marginal bands | Exact annual band arithmetic: 0%, 15%, 30%, 37%, 45%, with the full $18,200 threshold. Medicare levy, offsets, deductions, benefit withdrawals and under-18 rules are excluded. |
| Fiscal transmission | Treasury's July 2026 teacher presentation | Government purchases place orders; tax changes affect disposable income and household spending. Demand, resources, budget effects and distribution must be considered together. |
| Demand and supply pressure | RBA education explainers | Extra orders can raise production while resources are available; constraints and adverse supply changes can put pressure on prices. |
| Australian institutions | Treasury and RBA | Governments and parliaments make tax and budget decisions. The RBA determines monetary policy. The game does not let the Treasurer set the cash rate. |
| Shared information benefits | Bureau of Meteorology description of its warning services | Public warnings provide a concrete Australian connection. The economic classification is an explanatory application, not a claim that BOM uses the game's payoff or levy system. |

The national population, household incomes, $40.5bn baseline, capacity, $12bn starting net debt and all shocks are fictional. They are not scaled ABS estimates of Australia.

## Equations and interpretation

Households spend 80% of their income remaining after model tax and project contributions. This is a fixed classroom assumption, not an estimated Australian marginal propensity to consume. Other demand is fixed within a situation. All model orders are domestic, with no endogenous imports, investment, monetary response or further spending multiplier. A wage rise reallocates business earnings into wages; the game holds spending from those business earnings fixed.

Output is `min(demand, capacity)` and the price level is `max(1, demand / capacity)`. This hard boundary makes the resource constraint visible. It is not an econometric estimate of Australia's supply curve. Real sectors vary in their spare resources, pricing and adjustment speed. Inflation expectations, imported inputs, currency movements, policy responses and timing can alter outcomes. A single price index change is not a measured annual inflation rate or a forecast of Australian CPI.

Government revenue is the model income tax plus any project levy; spending is government purchases plus any government project purchases. The budget is a subset of a real Australian government's budget: GST, company tax, welfare and interest costs are not modelled. The equal-dollar extra tax or rebate is an explicitly fictional scenario, separate from the real marginal bands. Government investment can increase future capacity; this engine isolates its immediate orders and imposes capacity shocks separately.

Net financing is starting net debt minus closed-period balances minus the current projected balance. Editing a policy replaces that period's projection. If accumulated surpluses exceed starting net debt, the interface displays projected net financial assets rather than negative gross debt. No claim is made that Australian gross debt follows this equation alone.

Public-goods tokens and benefit points are experimental units. Each token buys $100 of project purchases per household in the represented group. The project's purchases are counted once, whether paid voluntarily or through a levy. The 0.4 points per contributed token is a classroom payoff rule, not a fiscal multiplier, cash return or estimate of a real warning service's benefits. Public funding does not by itself make a rival service a pure public good.

## Explicit teaching and continuity

Each topic now links an interactive everyday example to a named Youtopia mechanism and an Australian counterpart. The lunch stall distinguishes orders, production and capacity. The pay-rise display splits ten $100 amounts between $300 tax and $700 retained before the excluded adjustments. The caravan-park speaker distinguishes payment from receipt of a shared warning. The analogies include their limits.

Demonstrations never mutate the saved country. Applied explanations compare actual snapshots. Guided tax changes and pay rises calculate from current settings, including control limits, rather than describing a different starting point. Reapplying an identical policy does not repeatedly accrue income or debt. Round changes state both what carries over and what changes; the toastie quantities illustrate a mechanism rather than converting national figures into a literal food count.

## Primary sources

- ATO: https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents
- ASIC Moneysmart, current 2026–27 rates independently checked against the model: https://moneysmart.gov.au/work-and-tax/income-tax
- Treasury presentation hosted by the RBA, 10 July 2026: https://www.rba.gov.au/education/professional-development/teacher-immersion-series/2026/pdf/fiscal-policy.pdf
- RBA, causes of inflation: https://www.rba.gov.au/education/resources/explainers/causes-of-inflation.html
- RBA, monetary policy: https://www.rba.gov.au/education/resources/explainers/what-is-monetary-policy.html
- Bureau of Meteorology, role and services: https://www.bom.gov.au/about-the-bureau/vision-and-purpose/what-we-do
- CORE Econ, experimental public-goods foundation retained from the original game: https://books.core-econ.org/experiencing-economics/experiments/04-public-goods-game.html

## Validation

27 automated checks cover tax boundaries, national spending and financing identities, household/country scaling, conditional output and price effects, public-goods financing, saved states, undo, rounds, predictions without premature application, visual demonstrations without country mutation, continued policy changes and control limits. Exact file hashes and live browser checks are recorded in the release handover. Passing these checks establishes internal consistency within the stated assumptions, not external forecasting accuracy.
