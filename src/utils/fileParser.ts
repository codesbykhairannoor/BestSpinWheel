import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import Papa from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdf.js worker from CDN to avoid build issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const parseFileToNames = async (file: File): Promise<string[]> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  try {
    switch (extension) {
      case 'csv':
        return await parseCSV(file);
      case 'xlsx':
      case 'xls':
        return await parseExcel(file);
      case 'docx':
        return await parseDocx(file);
      case 'txt':
        return await parseTxt(file);
      case 'pdf':
        return await parsePdf(file);
      default:
        alert('Unsupported file type. Please upload a TXT, CSV, XLSX, DOCX, or PDF file.');
        return [];
    }
  } catch (error) {
    console.error('Error parsing file', error);
    alert('Error reading the file.');
    return [];
  }
};

const extractNamesFromText = (text: string): string[] => {
  return text.split(/\r?\n/).map(t => t.trim()).filter(t => t.length > 0);
};

const parseTxt = async (file: File): Promise<string[]> => {
  const text = await file.text();
  return extractNamesFromText(text);
};

const parseCSV = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        const names = results.data
          .flat()
          .filter(Boolean)
          .map(String)
          .map(t => t.trim())
          .filter(t => t.length > 0);
        resolve(names);
      },
      error: (err) => reject(err)
    });
  });
};

const parseExcel = async (file: File): Promise<string[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const names = json
    .flat()
    .filter(Boolean)
    .map(String)
    .map(t => t.trim())
    .filter(t => t.length > 0);
  return names;
};

const parseDocx = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return extractNamesFromText(result.value);
};

const parsePdf = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    fullText += strings.join('\n') + '\n';
  }
  return extractNamesFromText(fullText);
};
