function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeCellValue(value) {
  const text = String(value ?? '');
  return /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
}

function columnLetter(index) {
  let current = index + 1;
  let result = '';
  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }
  return result;
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function makeFileName(title, filter, extension) {
  const date = new Date().toISOString().slice(0, 10);
  const base = title.toLowerCase().replace(/\s+/g, '-');
  return `${base}-${filter}-${date}.${extension}`;
}

export async function downloadExcelWorkbook({ title, filter, headers, rows }) {
  const { strToU8, zipSync } = await import('fflate');
  const allRows = [headers, ...rows];
  const lastColumn = columnLetter(headers.length - 1);
  const rowXml = allRows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const reference = `${columnLetter(columnIndex)}${rowIndex + 1}`;
          const style = rowIndex === 0 ? ' s="1"' : '';
          return `<c r="${reference}" t="inlineStr"${style}><is><t xml:space="preserve">${escapeXml(
            safeCellValue(value)
          )}</t></is></c>`;
        })
        .join('');
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join('');

  const columnWidths = headers
    .map((header, index) => {
      const longest = Math.max(
        String(header).length,
        ...rows.map((row) => String(row[index] ?? '').length)
      );
      const width = Math.min(45, Math.max(12, longest + 2));
      return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
    })
    .join('');

  const files = {
    '[Content_Types].xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '</Types>'
    ),
    '_rels/.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>'
    ),
    'xl/workbook.xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      `<sheets><sheet name="${escapeXml(title.slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets>` +
      '</workbook>'
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>'
    ),
    'xl/styles.xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts>' +
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFCC2727"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf></cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>'
    ),
    'xl/worksheets/sheet1.xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      `<dimension ref="A1:${lastColumn}${Math.max(1, allRows.length)}"/>` +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      `<cols>${columnWidths}</cols><sheetData>${rowXml}</sheetData>` +
      `<autoFilter ref="A1:${lastColumn}${Math.max(1, allRows.length)}"/>` +
      '</worksheet>'
    ),
  };

  const bytes = zipSync(files, { level: 6 });
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, makeFileName(title, filter, 'xlsx'));
}
