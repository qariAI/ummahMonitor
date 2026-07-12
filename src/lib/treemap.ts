// Minimal squarified treemap layout (Bruls/Huizing/van Wijk algorithm,
// simplified). Takes items with a positive `value` and a rectangle, returns
// each item's laid-out rectangle. No external dependency — this project
// hand-rolls its visuals rather than pulling in a chart library.

export interface TreemapInput<T> {
  item: T;
  value: number;
}

export interface TreemapRect<T> {
  item: T;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function squarify<T>(
  inputs: TreemapInput<T>[],
  x: number,
  y: number,
  w: number,
  h: number,
): TreemapRect<T>[] {
  const items = inputs.filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  if (items.length === 0) return [];

  const total = items.reduce((s, i) => s + i.value, 0);
  const area = w * h;
  // Normalize values to area units so worst-ratio math is in area terms.
  const scaled = items.map((i) => ({ item: i.item, value: (i.value / total) * area }));

  const result: TreemapRect<T>[] = [];
  let remaining = scaled;
  let rx = x, ry = y, rw = w, rh = h;

  function worstRatio(row: typeof scaled, length: number): number {
    const sum = row.reduce((s, r) => s + r.value, 0);
    const rowMax = Math.max(...row.map((r) => r.value));
    const rowMin = Math.min(...row.map((r) => r.value));
    const sq = length * length;
    return Math.max((sq * rowMax) / (sum * sum), (sum * sum) / (sq * rowMin));
  }

  while (remaining.length > 0) {
    const length = Math.min(rw, rh); // the shorter side of the remaining rect
    let row: typeof scaled = [remaining[0]];
    let rest = remaining.slice(1);

    while (rest.length > 0) {
      const nextRow = [...row, rest[0]];
      if (worstRatio(nextRow, length) <= worstRatio(row, length)) {
        row = nextRow;
        rest = rest.slice(1);
      } else {
        break;
      }
    }

    const rowSum = row.reduce((s, r) => s + r.value, 0);
    const vertical = rw >= rh; // lay the row out along the longer axis
    if (vertical) {
      const rowWidth = rowSum / rh;
      let cursorY = ry;
      for (const r of row) {
        const rectH = r.value / rowWidth;
        result.push({ item: r.item, x: rx, y: cursorY, w: rowWidth, h: rectH });
        cursorY += rectH;
      }
      rx += rowWidth;
      rw -= rowWidth;
    } else {
      const rowHeight = rowSum / rw;
      let cursorX = rx;
      for (const r of row) {
        const rectW = r.value / rowHeight;
        result.push({ item: r.item, x: cursorX, y: ry, w: rectW, h: rowHeight });
        cursorX += rectW;
      }
      ry += rowHeight;
      rh -= rowHeight;
    }
    remaining = rest;
  }

  return result;
}
