# @saferinsulin/core

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/saferinsulin/core/test.yml)
[![codecov](https://codecov.io/gh/saferinsulin/core/branch/main/graph/badge.svg?token=4N5SRRV61X)](https://codecov.io/gh/saferinsulin/core)
![GitHub](https://img.shields.io/github/license/saferinsulin/core)

Core calculation module for [Safer Insulin](https://saferinsulin.org), a critical care insulin infusion rate calculator.

This module provides the clinical decision logic for calculating intravenous insulin infusion rates based on blood glucose readings. It is used by the [Safer Insulin website](https://saferinsulin.org) and is available as a standalone npm package.

It is provided to medical professionals for use at their own discretion: preparing the requirements for CE marking is underway and the tool has been used successfully in the Greater Manchester Critical Care Network.

## Installation

```bash
npm install @saferinsulin/core
```

## Usage

```js
import Calc from '@saferinsulin/core'

/* Instantiate a calculator object (defaults to latest algorithm version) */
const calc = new Calc()

/* Get a starting rate of insulin infusion */
const glucose = 17.2    // current glucose reading in mmol/L
const result = calc.startingRate(glucose)
console.log('New rate:', result.rate)
console.log('Advice:', result.advice)
console.log('Governance hex code:', result.hex)

/* Get a new rate of infusion when patient is already on insulin infusion */
const current = 12.1    // current glucose reading in mmol/L
const previous = 14.2   // previous glucose reading in mmol/L
const rate = 3          // current insulin infusion rate in ml/hr
const adjusted = calc.ongoingRate(current, previous, rate)
console.log('New rate:', adjusted.rate)
console.log('Advice:', adjusted.advice)
console.log('Governance hex code:', adjusted.hex)

/* Check a governance code */
const gov = calc.governance('0d7-a82820')
console.log('Function ID used:', gov.function)
console.log('Date generated:', gov.date)
console.log('Parameter passed:', gov.current)
```

## API

### `new Calc(version?)`

Creates a calculator instance. The optional `version` parameter selects the algorithm version:

| Version | Description |
|---------|-------------|
| `'2.0.0'` | Current algorithm (default) |
| `'1.0.0'` | Legacy algorithm (deprecated) |

### `calc.startingRate(glucose)`

Determines the initial insulin infusion rate for a patient not currently on insulin.

- `glucose` (number): Blood glucose reading in mmol/L (must be in 0.1 increments, non-negative)
- Returns an object with `rate`, `rateNum`, `advice`, and `hex` fields, or `false` on invalid input

### `calc.ongoingRate(current, previous, rate)`

Adjusts an existing insulin infusion rate based on the latest blood glucose reading.

- `current` (number): Current blood glucose in mmol/L (must be in 0.1 increments, non-negative)
- `previous` (number): Previous blood glucose in mmol/L (must be in 0.1 increments, non-negative)
- `rate` (number): Current infusion rate in ml/hr (must be in 0.1 increments, non-negative)
- Returns an object with `rate`, `rateNum`, `advice`, and `hex` fields, or `false` on invalid input

### `calc.governance(hex)`

Decodes a governance hex string back into the clinical decision data for audit purposes.

- `hex` (string): Governance code to decode
- Returns an object with `function`, `current`, `last`, `rate`, `date`, and `version` fields, or `null` on invalid input

## Governance Codes

Each calculation generates a hex-encoded governance code that captures the algorithm version, input values, and timestamp for audit traceability. The function IDs are:

| Function | Version | Description |
|----------|---------|-------------|
| a | 1.x.x | startingRate (legacy) |
| b | 1.x.x | ongoingRate (legacy) |
| c | 2.x.x | ongoingRate |
| d | 2.x.x | startingRate |

Previous versions of the algorithm are preserved to ensure governance codes can always be decoded.

## Input Validation

All numeric inputs to `startingRate` and `ongoingRate` must be:

- Valid numbers (not NaN)
- Non-negative
- In 0.1 increments (e.g., 8.0, 8.1, 8.2 — not 8.15)

Invalid inputs return `false`.

## Development

```bash
npm install       # Install dependencies
npm test          # Run tests with coverage
npm run build     # Compile and bundle (CJS + ESM)
npm run lint      # Lint
```

## License

MIT
