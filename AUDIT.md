# @saferinsulin/core Audit Findings

Audit performed: 2026-03-19
Scope: v2.0.0 algorithm only (v1.0.0 is deprecated and excluded)

## Finding 1: Decision Table Gaps Producing Negative Rate

**Severity: LOW (already mitigated by UI input clamping)**
**Status: MITIGATED**

The `ongoingRate200` decision table had multiple input combinations where no branch matched, leaving `A11 = 'LOGIC ERROR'` and producing `newR = -1` (a negative insulin rate). All gaps required inputs with precision finer than 0.1 increments (e.g., 2.25, 4.05, 12.15 mmol/L). The UI already clamped inputs to 0.1 increments, so these gaps were unreachable in practice. The library now enforces this constraint directly as defence-in-depth.

**Gaps identified:**
- `current` in (2.2, 2.3) — severe hypoglycaemia range
- `current` in (4.0, 4.1) — borderline hypoglycaemia range
- `current` in [4.1, 6.1) with `previous > 6` and `current - previous >= 0`
- `current` in [10.1, 12.1) with `previous > 12` and `current - previous >= 0`
- `current` in [12.1, 14] with `previous` in [12.1, 12.2) and `current - previous < 0`
- `current` in [12.1, 14] with `previous` in (14.4, 16.1) and `diff` in (-0.5, 0)
- `current` in [12.1, 14] with `previous` in [16.1, 18] and `diff` in (-4.0, -3.9)

**Mitigation:** Added `isValidIncrement()` validation to `startingRate200` and `ongoingRate200` that rejects any input not aligned to 0.1 increments, matching the UI constraint. Verified that with 0.1-aligned inputs the decision table is exhaustive — no gaps remain.

## Finding 2: No Negative Input Validation for `ongoingRate`

**Severity: LOW (already mitigated by UI input validation)**
**Status: MITIGATED**

`startingRate200` validates `bg < 0` and returns `false`. `ongoingRate200` had no equivalent check. Negative glucose values flow into the decision table (defaulting to rate=0, which is clinically safe) but produce corrupt governance codes via `glucoseToHex`, which outputs a `-` prefix that breaks the fixed-width hex field format.

Negative `previous` values could also cause unexpected results in rate formulas such as `rate * (current / previous)`.

The UI already prevents negative inputs. **Mitigation:** Added negative value validation to `ongoingRate200` as defence-in-depth, rejecting any negative current, previous, or rate values.

## Finding 3: `rateToHex(NaN)` Produces Garbage Hex Code

**Severity: MEDIUM (Defence-in-Depth)**
**Status: FIXED**

`rateToHex` checked for `null` and `undefined` but not `NaN`. `NaN.toString(16)` produces `'NaN'`, and `'0NaN'.slice(-2)` yields `'aN'` — a valid-looking 2-character string silently embedded in governance codes.

Unreachable via the public API because `NaN` is rejected earlier in the call chain, but represented a defence-in-depth gap.

**Fix:** Added `Number.isNaN(i)` check to `rateToHex`, returning `'failed'` consistently with other invalid inputs.

## Finding 4: `glucoseToHex(0)` Returns `'failed'`

**Severity: LOW**
**Status: FIXED**

`glucoseToHex` used `if (!i)` which treated `0` as invalid, returning the string `'failed'`. This was inconsistent with `rateToHex`, which correctly handled `0` via explicit `=== null || === undefined` checks. Clinically unreachable (BG of 0 is impossible) but inconsistent.

**Fix:** Changed `glucoseToHex` guard to use explicit `i === null || i === undefined || Number.isNaN(i)`, consistent with `rateToHex`. Both functions now handle `null`, `undefined`, and `NaN` identically.

## Finding 5: Brute-Force Test Has Limited Coverage

**Severity: INFORMATIONAL**
**Status: CLOSED**

The brute-force test (`test/brute-force.test.ts`) iterates BG values from 3.1-30.0 and rate from 0-15.0 in 0.1 steps. These ranges match the UI input constraints, ensuring all possible input combinations from the frontend are covered. The test verifies no negative rates are produced for any valid UI input.

Previously noted gaps (values below 3.1, rates above 15.0) fall outside the UI's permitted input range and are not reachable in practice.

## Finding 6: Undocumented Overlap Semantics in Decision Table

**Severity: INFORMATIONAL**
**Status: CLOSED**

The decision table in `ongoingRate200` uses sequential `if` blocks (not `if-else`). Several conditions overlap intentionally, relying on last-match-wins evaluation order. For example, codes `'35'` and `'37'` both match for `previous` in [132, 144] with `diff` in [-10, -5], with `'37'` (maintain rate) winning by appearing later.

**Resolution:** Added inline documentation to the decision table explaining the sequential evaluation strategy, the 10x integer scaling rationale, and the specific overlap between `'35'` and `'37'` with a warning not to reorder blocks.

## Finding 7: Inconsistent Governance Failure Handling

**Severity: LOW**
**Status: OPEN**

`startingRate200` returns a result object with `hex: false` when governance generation fails. `ongoingRate200` returns `false` entirely, discarding the computed rate. This creates an inconsistent API contract for callers.
