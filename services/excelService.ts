
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import { Student, AttendanceStatus } from '../types';

export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "التوزيع");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const readExcelFile = (file: File): Promise<XLSX.WorkBook> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      resolve(workbook);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const getSheetData = (workbook: XLSX.WorkBook, sheetName: string): any[][] => {
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
};

// parseStudents transforms raw excel rows into Student objects based on UI mapping
export const parseStudents = (data: any[][], mapping: any, headerRowIndex: number): Student[] => {
  const students: Student[] = [];
  const rows = data.slice(headerRowIndex + 1);
  
  rows.forEach((row, idx) => {
    const name = String(row[mapping.nameIdx] || '').trim();
    if (!name) return;

    const studentId = String(row[mapping.idIdx] || '').trim();
    const grade = String(row[mapping.gradeIdx] || '').trim();
    const className = String(row[mapping.classIdx] || '').trim();
    const phone = mapping.phoneIdx !== -1 ? String(row[mapping.phoneIdx] || '').trim() : '';

    students.push({
      id: `s-${Date.now()}-${idx}`,
      name,
      studentId,
      grade,
      class: className,
      phone,
      seatNumber: studentId,
      status: AttendanceStatus.PENDING
    });
  });

  return students;
};
