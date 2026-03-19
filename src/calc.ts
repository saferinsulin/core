/* eslint-disable class-methods-use-this */

interface starting {
  advice: { type: string; text: (string | false)[] };
  rate: string;
  rateNum: number;
  hex: string | false;
}

interface onGoing {
  rateNum: number;
  rate: string;
  advice: { text: string[]; type: string };
  hex: string | false;
}

interface ongoingAdvice {
  rateNum: number;
  rate: string;
  advice: { text: string[]; type: string };
  hex: string;
}

export default class Calc {
  version: number | null;

  isValidIncrement(value: number): boolean {
    return Math.abs(Math.round(value * 10) - value * 10) < 0.0001;
  }

  constructor(v?: string) {
    // 0.0.0 is test runner
    if (v === '0.0.0') {
      this.version = 0;
      return;
    }
    if (v === '1.0.0') {
      this.version = 100;
      return;
    }
    if (v === '2.0.0') {
      this.version = 200;
      return;
    }
    // default to 2.0.0
    if (v === undefined) {
      this.version = 200;
      return;
    }
    // if invalid version passed, fail
    this.version = null;
  }

  startingRate(passedValue?: string | number | undefined): starting | false {
    if (passedValue === undefined) {
      return false;
    }
    if (this.version === 100) {
      return this.startingRate100(passedValue.toString());
    }
    if (this.version === 200 || this.version === 0) {
      return this.startingRate200(passedValue.toString());
    }
    return false;
  }

  ongoingRate(
    passedCurrent?: string | number,
    passedPrevious?: string | number,
    passedRate?: string | number
  ): onGoing | false {
    if (passedCurrent === undefined || passedPrevious === undefined || passedRate === undefined) {
      return false;
    }
    if (this.version === 100) {
      return this.ongoingRate100(passedCurrent.toString(), passedPrevious.toString(), passedRate.toString());
    }
    if (this.version === 200 || this.version === 0) {
      return this.ongoingRate200(passedCurrent.toString(), passedPrevious.toString(), passedRate.toString());
    }
    return false;
  }

  hexDateConvert(fr: string): Date {
    const dt = new Date();
    let f = parseInt(fr, 16);
    f += 25678678;
    dt.setTime(f * 60000);
    return dt;
  }

  getHexDate(n: Date): string {
    let m = Math.floor(n.getTime() / 60000);
    m -= 25678678;
    const x = m.toString(16);
    return x;
  }

  glucoseToHex(i: number | null | undefined): string {
    if (i === null || i === undefined || Number.isNaN(i)) {
      return 'failed';
    }
    const x = i * 10;
    let y = `00${x.toString(16).substr(-16)}`;
    y = y.slice(-3);
    return y;
  }

  rateToHex(i: number | null | undefined): string {
    if (i === null || i === undefined || Number.isNaN(i)) {
      return 'failed';
    }
    const x = i * 10;
    let y = `0${x.toString(16).substr(-16)}`;
    y = y.slice(-2);
    return y;
  }

  hexToFloat(i: string): number {
    return parseInt(i, 16) / 10;
  }

  governance(hex?: string | null | undefined): {
    function: string;
    current: number | null;
    last: number | null;
    rate: number | null;
    date: string;
    version: string | null;
  } | null {
    if (!hex || hex === undefined) {
      return null;
    }
    const codes = hex.split('-');
    if (codes.length !== 2) {
      return null;
    }
    const f = codes[1].charAt(0);
    const d = this.hexDateConvert(codes[1].substr(1, codes[1].length));
    let version = null;
    let rate = null;
    let curr = null;
    let last = null;
    if (f === 'd' || f === 'a') {
      curr = this.hexToFloat(codes[0].substr(0, 3));
    }
    if (f === 'a' || f === 'b') {
      version = '1.0.0';
    }
    if (f === 'c' || f === 'd') {
      version = '2.0.0';
    }
    if (f === 'b' || f === 'c') {
      rate = this.hexToFloat(codes[0].substr(0, 2));
      curr = this.hexToFloat(codes[0].substr(2, 3));
      last = this.hexToFloat(codes[0].substr(5, 3));
    }
    if (version === null) {
      return null;
    }
    return {
      function: f,
      current: curr,
      last,
      rate,
      date: d.toString(),
      version,
    };
  }

  createGovernance(obj: {
    f: string;
    glucose?: number;
    rate?: number;
    current?: number;
    previous?: number | undefined;
  }): string | false {
    const n = new Date();
    if (this.version === 0) {
      return false;
    }
    if (obj.f === 'a' || obj.f === 'd') {
      const hex = `${this.glucoseToHex(obj.glucose)}-${obj.f}${this.getHexDate(n)}`;
      return hex;
    }
    if (obj.f === 'b' || obj.f === 'c') {
      const h = `${this.rateToHex(obj.rate) + this.glucoseToHex(obj.current) + this.glucoseToHex(obj.previous)}-${
        obj.f
      }${this.getHexDate(n)}`;
      return h;
    }
    return false;
  }

  ongoingRate100(passedCurrent?: string, passedPrevious?: string, passedRate?: string) {
    const r: ongoingAdvice | false = {
      rateNum: 0,
      rate: '',
      advice: { text: [''], type: '' },
      hex: '',
    };
    if (passedCurrent === undefined || passedPrevious === undefined || passedRate === undefined) {
      return false;
    }
    if (
      Number.isNaN(parseFloat(passedCurrent)) ||
      Number.isNaN(parseFloat(passedPrevious)) ||
      Number.isNaN(parseFloat(passedRate))
    ) {
      return false;
    }
    const current: number = parseFloat(passedCurrent);
    const previous: number = parseFloat(passedPrevious);
    const rate: number = parseFloat(passedRate);
    let A11 = 'LOGIC ERROR';
    if (current <= 2.2) {
      A11 = '1';
    }
    if (current >= 2.3 && current <= 4) {
      A11 = '2';
    }
    if (current >= 4.1 && current < 6.1 && previous <= 6) {
      A11 = '3';
    }
    if (current >= 4.1 && current < 6.1 && previous > 6 && current - previous < -1.5) {
      A11 = '2';
    }
    if (current >= 4.1 && current < 6.1 && previous > 6 && current - previous >= -1.5 && current - previous < 0) {
      A11 = '3';
    }
    if (current >= 6.1 && current < 8 && rate < 1.5) {
      A11 = '29';
    }
    if (current >= 6.1 && current < 8 && rate > 1.5) {
      A11 = '53';
    }
    if (current >= 8 && current < 10.1 && (previous < 8 || previous > 10)) {
      A11 = '10';
    }
    if (current >= 8 && current < 10.1 && previous >= 8 && previous <= 10) {
      A11 = '54';
    }
    if (current >= 10.1 && current < 12.1 && previous <= 12 && current - previous < 0) {
      A11 = '17';
    }
    if (current >= 10.1 && current < 12.1 && previous <= 12 && current - previous >= 0) {
      A11 = '36';
    }
    if (current >= 10.1 && current < 12.1 && previous > 12 && current - previous < 0 && current - previous >= -2) {
      A11 = '32';
    }
    if (current >= 10.1 && current < 12.1 && previous > 12 && current - previous < -2) {
      A11 = '33';
    }
    if (current >= 12.1 && current <= 14 && previous < 12.1) {
      A11 = '34';
    }
    if (current >= 12.1 && current <= 14 && previous >= 12.1 && previous <= 14 && current - previous >= 0) {
      A11 = '35';
    }
    if (
      current >= 12.1 &&
      current <= 14 &&
      previous >= 12.2 &&
      previous <= 14.4 &&
      current - previous < 0 &&
      current - previous >= -1
    ) {
      A11 = '35';
    }
    if (
      current >= 12.1 &&
      current <= 14 &&
      previous >= 13.2 &&
      previous <= 18 &&
      current - previous <= -0.5 &&
      current - previous >= -3.9
    ) {
      A11 = '37';
    }
    if (current >= 12.1 && current <= 14 && previous >= 16.1 && previous <= 18 && current - previous <= -4) {
      A11 = '33';
    }
    if (current >= 12.1 && current <= 14 && previous > 18) {
      A11 = '33';
    }
    if (current > 14 && previous < 12.1) {
      A11 = '38';
    }
    if (current > 14 && previous >= 12.1 && previous <= 14) {
      A11 = '34';
    }
    if (current > 14 && previous > 14 && current - previous > 0) {
      A11 = '38';
    }
    if (current > 14 && previous > 14 && current - previous <= 0 && current - previous >= -1.9) {
      A11 = '34';
    }
    if (current > 14 && previous > 14 && current - previous < -1.9 && current - previous > -4) {
      A11 = '18';
    }
    if (current > 14 && previous > 14 && current - previous <= -4) {
      A11 = '33';
    }
    let newR = -1;
    if (A11 === '1') {
      newR = 0;
    }
    if (A11 === '2') {
      newR = 0;
    }
    if (A11 === '3') {
      newR = 0;
    }
    if (A11 === '10') {
      newR = rate * (current / previous);
    }
    if (A11 === '17') {
      newR = rate;
    }
    if (A11 === '18') {
      newR = rate;
    }
    if (A11 === '29') {
      newR = 0;
    }
    if (A11 === '32') {
      newR = rate;
    }
    if (A11 === '33') {
      newR = rate * (current / previous);
    }
    if (A11 === '34') {
      newR = rate + 2;
    }
    if (A11 === '35') {
      newR = rate + 1;
    }
    if (A11 === '36') {
      newR = rate + 1;
    }
    if (A11 === '37') {
      newR = rate;
    }
    if (A11 === '38') {
      newR = rate + 2 * (current / previous);
    }
    if (A11 === '53') {
      newR = rate * 0.5;
    }
    if (A11 === '54') {
      newR = rate;
    }
    newR = Math.round(newR * 10) / 10;
    if (newR > 18) {
      newR = 18;
    }
    const result = `${newR}ml/hr`;
    r.rate = result;
    r.rateNum = newR;
    if (A11 === '1') {
      r.advice = {
        type: 'additional',
        text: [
          'STOP INSULIN FOR AT LEAST 1 HOUR',
          'Follow hypoglycaemia protocol.',
          'Give IV dextrose immediately & ensure background nutrition or glucose intake.',
          'Recheck blood glucose in 15, 30 and 60 minutes until stable.',
        ],
      };
    }
    if (A11 === '2') {
      r.advice = {
        type: 'additional',
        text: [
          'STOP INSULIN FOR AT LEAST 1 HOUR',
          'Give IV dextrose immediately if blood glucose < 4mmol/L & ensure background nutrition or glucose intake.',
          ' If blood glucose is greater than 4mmol/l then it is falling rapidly. Recheck blood glucose in 30 and 60 minutes.',
        ],
      };
    }
    if (A11 === '3') {
      r.advice = {
        type: 'additional',
        text: [
          'STOP INSULIN FOR AT LEAST 1 HOUR',
          'Ensure background nutrition or glucose intake. Recheck blood glucose in 1 hour.',
        ],
      };
    }
    if (A11 === '10') {
      r.advice = {
        type: 'additional',
        text: [
          'Recheck blood glucose in 1 hour.',
          'If blood glucose has been between 6-10mmol consider 2 hourly blood glucose checks.',
        ],
      };
    }
    if (A11 === '17') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 1 hour. '] };
    }
    if (A11 === '18') {
      r.advice = {
        type: 'additional',
        text: ['Recheck blood glucose in 1-2 hours.', '(1 hour if drop in blood glucose > 2 mmol/L in last hour)'],
      };
    }
    if (A11 === '29') {
      r.advice = {
        type: 'additional',
        text: ['STOP INSULIN FOR AT LEAST 1 HOUR', 'Restart insulin if blood glucose > 10mmol/L'],
      };
    }
    if (A11 === '32') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 2 hours.'] };
    }
    if (A11 === '33') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 1 hour.'] };
    }
    if (A11 === '34') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 1 hour.'] };
    }
    if (A11 === '35') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 1 hour.'] };
    }
    if (A11 === '36') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 2 hours.'] };
    }
    if (A11 === '37') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 1 hour.'] };
    }
    if (A11 === '38') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 1 hour.'] };
    }
    if (A11 === '53') {
      r.advice = {
        type: 'additional',
        text: ['Recheck blood glucose in 1 hour.', 'Caution as blood glucose is approaching bottom of target range.'],
      };
    }
    if (A11 === '54') {
      r.advice = {
        type: 'additional',
        text: ['If blood glucose and calorie intake have been stable for last 2 hours move to 2 hourly BG checks. '],
      };
    }
    const hex = this.createGovernance({
      f: 'b',
      rate,
      current,
      previous,
    });
    if (!hex) {
      return false;
    }
    r.hex = hex;
    return r;
  }

  startingRate100(passedValue?: string | undefined):
    | {
        advice: { type: string; text: (string | false)[] };
        rate: string;
        rateNum: number;
        hex: string | false;
      }
    | false {
    if (passedValue === undefined) {
      return false;
    }
    if (Number.isNaN(parseFloat(passedValue))) {
      return false;
    }
    const bg = parseFloat(passedValue);
    if (bg < 0) {
      return false;
    }
    let result: false | string = false;
    let rate = '';
    let rateNum = 0;
    if (bg <= 4) {
      result = 'Treat hypoglycaemia according to protocol';
      rate = 'N/A';
      rateNum = 0;
    }
    if (bg > 4 && bg <= 10) {
      result = 'No insulin required - recheck 4-6 hourly';
      rate = 'N/A';
      rateNum = 0;
    }
    if (bg > 10 && bg <= 12) {
      result = 'Start insulin at 1 unit/hr';
      rate = '1';
      rateNum = 1;
    }
    if (bg > 12 && bg <= 15) {
      result = 'Start insulin at 2 units/hr';
      rate = '2';
      rateNum = 2;
    }
    if (bg > 15 && bg <= 18) {
      result = 'Start insulin at 3 units/hr';
      rate = '3';
      rateNum = 3;
    }
    if (bg > 18) {
      result = 'Start insulin at 4 units/hr';
      rate = '4';
      rateNum = 4;
    }
    const hex = this.createGovernance({ f: 'a', glucose: bg });
    return {
      advice: { type: 'normal', text: [result] },
      rate,
      rateNum,
      hex,
    };
  }

  startingRate200(
    passedValue: string
  ):
    | { advice: { type: string; text: (string | false)[] }; rate: string; rateNum: number; hex: string | false }
    | false {
    if (Number.isNaN(parseFloat(passedValue))) {
      return false;
    }
    const bg = parseFloat(passedValue);
    if (bg < 0) {
      return false;
    }
    if (!this.isValidIncrement(bg)) {
      return false;
    }
    let result: false | string = false;
    let rate = '';
    let rateNum = 0;
    if (bg <= 4) {
      result = 'Treat hypoglycaemia according to protocol';
      rate = 'N/A';
      rateNum = 0;
    }
    if (bg > 4 && bg <= 10) {
      result = 'No insulin required - recheck 4-6 hourly';
      rate = 'N/A';
      rateNum = 0;
    }
    if (bg > 10 && bg <= 12) {
      result = 'Start insulin at 1 unit/hr';
      rate = '1';
      rateNum = 1;
    }
    if (bg > 12 && bg <= 15) {
      result = 'Start insulin at 2 units/hr';
      rate = '2';
      rateNum = 2;
    }
    if (bg > 15 && bg <= 18) {
      result = 'Start insulin at 3 units/hr';
      rate = '3';
      rateNum = 3;
    }
    if (bg > 18) {
      result = 'Start insulin at 4 units/hr';
      rate = '4';
      rateNum = 4;
    }
    const hex = this.createGovernance({ f: 'd', glucose: bg });
    return {
      advice: { type: 'normal', text: [result] },
      rate,
      rateNum,
      hex,
    };
  }

  ongoingRate200(passedCurrent: string, passedPrevious: string, passedRate: string) {
    const r: ongoingAdvice | false = {
      rateNum: 0,
      rate: '',
      advice: { text: [''], type: '' },
      hex: '',
    };
    if (
      Number.isNaN(parseFloat(passedCurrent)) ||
      Number.isNaN(parseFloat(passedPrevious)) ||
      Number.isNaN(parseFloat(passedRate))
    ) {
      return false;
    }
    const parsedCurrent = parseFloat(passedCurrent);
    const parsedPrevious = parseFloat(passedPrevious);
    const parsedRate = parseFloat(passedRate);
    if (!this.isValidIncrement(parsedCurrent) || !this.isValidIncrement(parsedPrevious) || !this.isValidIncrement(parsedRate)) {
      return false;
    }
    if (parsedCurrent < 0 || parsedPrevious < 0 || parsedRate < 0) {
      return false;
    }
    let current: number = parsedCurrent * 10;
    let previous: number = parsedPrevious * 10;
    let rate: number = parsedRate * 10;
    // Decision table: sequential if-blocks (NOT if-else). Where conditions overlap,
    // the LAST matching block wins. This is intentional — later blocks represent
    // higher-priority clinical scenarios that override earlier matches.
    // DO NOT reorder these blocks without reviewing all overlapping conditions.
    //
    // All values are 10x scaled (e.g. 61 = 6.1 mmol/L) to avoid floating-point
    // comparison issues. Inputs are validated to 0.1 increments, ensuring scaled
    // values are integers and the decision ranges are exhaustive.

    // current <= 2.2: severe hypoglycaemia
    let A11 = 'LOGIC ERROR';
    if (current <= 22) {
      A11 = '1';
    }
    // current 2.3-4.0: hypoglycaemia
    if (current >= 23 && current <= 40) {
      A11 = '2';
    }
    // current 4.1-6.0: low range
    if (current >= 41 && current < 61 && previous <= 60) {
      A11 = '3';
    }
    if (current >= 41 && current < 61 && previous > 60 && current - previous < -15) {
      A11 = '2';
    }
    if (current >= 41 && current < 61 && previous > 60 && current - previous >= -15 && current - previous < 0) {
      A11 = '3';
    }
    // current 6.1-7.9: below target range
    if (current >= 61 && current < 80 && rate <= 15) {
      A11 = '29';
    }
    if (current >= 61 && current < 80 && rate > 15) {
      A11 = '53';
    }
    // current 8.0-10.0: target range
    if (current >= 80 && current < 101 && (previous < 80 || previous > 100)) {
      A11 = '10';
    }
    if (current >= 80 && current < 101 && previous >= 80 && previous <= 100) {
      A11 = '54';
    }
    // current 10.1-12.0: above target
    if (current >= 101 && current < 121 && previous <= 120 && current - previous < 0) {
      A11 = '17';
    }
    if (current >= 101 && current < 121 && previous <= 120 && current - previous >= 0) {
      A11 = '36';
    }
    if (current >= 101 && current < 121 && previous > 120 && current - previous < 0 && current - previous >= -20) {
      A11 = '32';
    }
    if (current >= 101 && current < 121 && previous > 120 && current - previous < -20) {
      A11 = '33';
    }
    // current 12.1-14.0: elevated — overlapping conditions below are intentional.
    // Overlap 1: '35' (L650-658) and '37' (L660-668) both match when
    //   previous in [132,144] and diff in [-10,-5]. '37' (maintain rate) wins,
    //   prioritising caution when BG is dropping from a moderately high level.
    if (current >= 121 && current <= 140 && previous < 121) {
      A11 = '34';
    }
    if (current >= 121 && current <= 140 && previous >= 121 && previous <= 140 && current - previous >= 0) {
      A11 = '35';
    }
    if (
      current >= 121 &&
      current <= 140 &&
      previous >= 122 &&
      previous <= 144 &&
      current - previous < 0 &&
      current - previous >= -10
    ) {
      A11 = '35';
    }
    // Overlaps with '35' above — '37' takes priority (last-match-wins)
    if (
      current >= 121 &&
      current <= 140 &&
      previous >= 132 &&
      previous <= 180 &&
      current - previous <= -5 &&
      current - previous >= -39
    ) {
      A11 = '37';
    }
    if (current >= 121 && current <= 140 && previous >= 161 && previous <= 180 && current - previous <= -40) {
      A11 = '33';
    }
    if (current >= 121 && current <= 140 && previous > 180) {
      A11 = '33';
    }
    // current > 14.0: high
    if (current > 140 && previous < 121) {
      A11 = '38';
    }
    if (current > 140 && previous >= 121 && previous <= 140) {
      A11 = '34';
    }
    if (current > 140 && previous > 140 && current - previous > 0) {
      A11 = '38';
    }
    if (current > 140 && previous > 140 && current - previous <= 0 && current - previous >= -19) {
      A11 = '34';
    }
    if (current > 140 && previous > 140 && current - previous < -19 && current - previous > -40) {
      A11 = '18';
    }
    if (current > 140 && previous > 140 && current - previous <= -40) {
      A11 = '33';
    }
    current = current / 10;
    previous = previous / 10;
    rate = rate / 10;
    let newR = -1;
    if (A11 === '1') {
      newR = 0;
    }
    if (A11 === '2') {
      newR = 0;
    }
    if (A11 === '3') {
      newR = 0;
    }
    if (A11 === '10') {
      newR = rate * (current / previous);
    }
    if (A11 === '17') {
      newR = rate;
    }
    if (A11 === '18') {
      newR = rate;
    }
    if (A11 === '29') {
      newR = 0;
    }
    if (A11 === '32') {
      newR = rate;
    }
    if (A11 === '33') {
      newR = rate * (current / previous);
    }
    if (A11 === '34') {
      newR = rate + 2;
    }
    if (A11 === '35') {
      newR = rate + 1;
    }
    if (A11 === '36') {
      newR = rate + 1;
    }
    if (A11 === '37') {
      newR = rate;
    }
    if (A11 === '38') {
      newR = rate + 2 * (current / previous);
    }
    if (A11 === '53') {
      newR = rate * 0.5;
    }
    if (A11 === '54') {
      newR = rate;
    }
    newR = Math.round(newR * 10) / 10;
    if (newR > 18) {
      newR = 18;
    }
    const result = `${newR}ml/hr`;
    r.rate = result;
    r.rateNum = newR;
    if (A11 === '1') {
      r.advice = {
        type: 'additional',
        text: [
          'STOP INSULIN FOR AT LEAST 1 HOUR',
          'Follow hypoglycaemia protocol.',
          'Give IV dextrose immediately & ensure background nutrition or glucose intake.',
          'Recheck blood glucose in 15, 30 and 60 minutes until stable.',
        ],
      };
    }
    if (A11 === '2') {
      r.advice = {
        type: 'additional',
        text: [
          'STOP INSULIN FOR AT LEAST 1 HOUR',
          'Give IV dextrose immediately if blood glucose < 4mmol/L & ensure background nutrition or glucose intake.',
          ' If blood glucose is greater than 4mmol/L then it is falling rapidly. Recheck blood glucose in 30 and 60 minutes.',
        ],
      };
    }
    if (A11 === '3') {
      r.advice = {
        type: 'additional',
        text: [
          'STOP INSULIN FOR AT LEAST 1 HOUR',
          'Ensure background nutrition or glucose intake. Recheck blood glucose in 1 hour.',
        ],
      };
    }
    if (A11 === '10') {
      r.advice = {
        type: 'additional',
        text: [
          'Recheck blood glucose in 1 hour.',
          'If blood glucose has been between 6-10mmol consider 2 hourly blood glucose checks.',
        ],
      };
    }
    if (A11 === '17') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 1 hour. '] };
    }
    if (A11 === '18') {
      r.advice = {
        type: 'additional',
        text: ['Recheck blood glucose in 1-2 hours.', '(1 hour if drop in blood glucose > 2 mmol/L in last hour)'],
      };
    }
    if (A11 === '29') {
      r.advice = {
        type: 'additional',
        text: ['STOP INSULIN FOR AT LEAST 1 HOUR', 'Restart insulin if blood glucose > 10mmol/L'],
      };
    }
    if (A11 === '32') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 2 hours.'] };
    }
    if (A11 === '33') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 1 hour.'] };
    }
    if (A11 === '34') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 1 hour.'] };
    }
    if (A11 === '35') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 1 hour.'] };
    }
    if (A11 === '36') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 2 hours.'] };
    }
    if (A11 === '37') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 1 hour.'] };
    }
    if (A11 === '38') {
      r.advice = { type: 'additional', text: ['Recheck blood glucose in 1 hour.'] };
    }
    if (A11 === '53') {
      r.advice = {
        type: 'additional',
        text: ['Recheck blood glucose in 1 hour.', 'Caution as blood glucose is approaching bottom of target range.'],
      };
    }
    if (A11 === '54') {
      r.advice = {
        type: 'additional',
        text: ['If blood glucose and calorie intake have been stable for last 2 hours move to 2 hourly BG checks. '],
      };
    }
    const hex = this.createGovernance({
      f: 'c',
      rate,
      current,
      previous,
    });
    if (!hex) {
      return false;
    }
    r.hex = hex;
    return r;
  }
}
