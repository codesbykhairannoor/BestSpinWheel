export async function parseFile(file: File): Promise<string[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  try {
    switch (ext) {
      case 'csv':
        return await parseCSV(file);
      case 'xlsx':
      case 'xls':
        return await parseExcel(file);
      case 'docx':
        return await parseDocx(file);
      case 'pdf':
        return await parsePDF(file);
      case 'txt':
        return await parseText(file);
      default:
        throw new Error('Unsupported format. Use .txt, .csv, .xlsx, .docx, or .pdf');
    }
  } catch (error) {
    console.error("Error parsing file:", error);
    throw new Error(`Failed to parse ${file.name}. Please ensure it is a valid document.`);
  }
}

// ---------------------------------------------------------
// SMART EXTRACTION HEURISTICS
// ---------------------------------------------------------

const NAME_HEADERS = ['nama', 'name', 'peserta', 'siswa', 'mahasiswa', 'karyawan', 'kandidat', 'fullname', 'full name', 'pemenang', 'anggota', 'member'];

function extractFromTabular(rows: any[][]): string[] {
  let targetColIdx = -1;
  let startRowIdx = 0;

  // 1. Scan first 10 rows for a "Name" header
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;
    
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '').toLowerCase().trim();
      if (NAME_HEADERS.includes(cell)) {
        targetColIdx = c;
        startRowIdx = r + 1;
        break;
      }
    }
    if (targetColIdx !== -1) break;
  }

  // 2. Fallback: If no header found, guess the column with the most "Title Case" text (or simply the first string column)
  if (targetColIdx === -1) {
    targetColIdx = 0; // Default to first col
    for (let c = 0; c < 5; c++) {
      let stringCount = 0;
      let numberCount = 0;
      for (let r = 0; r < Math.min(rows.length, 20); r++) {
        const val = rows[r]?.[c];
        if (val) {
          if (!isNaN(Number(val))) numberCount++;
          else if (typeof val === 'string' && val.trim().length > 2) stringCount++;
        }
      }
      // If we find a column that is heavily text (not just IDs/numbers), we pick it.
      if (stringCount > numberCount && stringCount > 2) {
        targetColIdx = c;
        break;
      }
    }
  }

  // 3. Extract data from the determined column
  const rawNames = [];
  for (let r = startRowIdx; r < rows.length; r++) {
    const val = rows[r]?.[targetColIdx];
    if (val && typeof val === 'string') {
      rawNames.push(val);
    }
  }

  return cleanNamesList(rawNames);
}

function processUnstructuredText(text: string): string[] {
  const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const extracted = [];

  // Regex matches typical name lines, e.g., "1. Budi Santoso", "- Andi", "Siti Aminah"
  // It ignores long paragraphs, random numbers, and symbols.
  const namePattern = /^(?:\s*(?:\d+[\.\)]\s*|-|\*)\s*)?([A-Za-z\s'\-,\.]{3,50})\s*$/;

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check if it's a header line that we should skip
    const lower = trimmed.toLowerCase();
    if (NAME_HEADERS.some(h => lower.includes(h))) continue;

    const match = trimmed.match(namePattern);
    if (match && match[1]) {
      const nameCand = match[1].trim();
      // Only accept if it looks like a real name (not just one letter, not a full sentence)
      if (nameCand.length > 2 && nameCand.split(' ').length <= 5) {
        extracted.push(nameCand);
      }
    } else if (trimmed.length > 2 && trimmed.length < 50 && !/\d{5,}/.test(trimmed)) {
      // Fallback for lines that might be valid names without bullets
      // Exclude things with long numbers (phone numbers, IDs)
      extracted.push(trimmed);
    }
  }

  return cleanNamesList(extracted);
}

function cleanNamesList(names: string[]): string[] {
  return names
    .map(n => n.trim())
    .filter(n => n.length > 1 && n.length < 50); // Sanity check length
}

// ---------------------------------------------------------
// PARSERS
// ---------------------------------------------------------

async function parseText(file: File): Promise<string[]> {
  const text = await file.text();
  return processUnstructuredText(text);
}

async function parseCSV(file: File): Promise<string[]> {
  const text = await file.text();
  // @ts-ignore
  const Papa = (await import('papaparse')).default;
  
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      skipEmptyLines: true,
      complete: (results: any) => {
        resolve(extractFromTabular(results.data));
      },
      error: (error: any) => reject(error)
    });
  });
}

async function parseExcel(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore
  const XLSX = await import('xlsx');
  
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  return extractFromTabular(json);
}

async function parseDocx(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore
  const mammoth = await import('mammoth');
  
  const result = await mammoth.extractRawText({ arrayBuffer });
  return processUnstructuredText(result.value);
}

async function parsePDF(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import('pdfjs-dist');
  
  const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    fullText += strings.join(' ') + '\n';
  }
  
  return processUnstructuredText(fullText);
}
