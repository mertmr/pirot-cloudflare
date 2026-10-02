import { zipSync, strToU8 } from 'fflate';
import { Decimal } from './value';
export type CellValue = string | number | null;
function xml(value: unknown): string {
  return Array.from(String(value ?? ''))
    .filter(c => {
      const n = c.codePointAt(0)!;
      return n >= 32 || n === 9 || n === 10 || n === 13;
    })
    .join('')
    .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
}
function column(index: number): string {
  let result = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + ((n - 1) % 26)) + result;
  return result;
}
export function workbook(headers: string[], rows: CellValue[][]): Uint8Array {
  const sheet = [headers, ...rows]
    .map(
      (row, i) =>
        `<row r="${i + 1}">${row
          .map((value, j) => {
            const address = `${column(j)}${i + 1}`;
            let numeric = false;
            if (i > 0 && value !== null && /^-?\d+(\.\d+)?$/.test(String(value))) {
              const d = new Decimal(value);
              numeric = d.isFinite() && d.sd() <= 15 && d.abs().lte(Number.MAX_SAFE_INTEGER);
            }
            return numeric
              ? `<c r="${address}" t="n"><v>${xml(value)}</v></c>`
              : `<c r="${address}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
          })
          .join('')}</row>`,
    )
    .join('');
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    ),
    '_rels/.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ),
    'xl/workbook.xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Mali Stok Raporu" sheetId="1" r:id="rId1"/></sheets></workbook>',
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    ),
    'xl/worksheets/sheet1.xml': strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="35" customWidth="1"/><col min="2" max="4" width="18" customWidth="1"/></cols><sheetData>${sheet}</sheetData><autoFilter ref="A1:${column(headers.length - 1)}${rows.length + 1}"/></worksheet>`,
    ),
  };
  return zipSync(files, { level: 6 });
}
