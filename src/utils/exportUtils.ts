import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AttendanceRecord } from '../types';

/**
 * Export Attendance Records to PDF Report
 */
export function exportAttendanceToPDF(
  records: AttendanceRecord[],
  reportTitle: string = 'SmartFace AI - Enterprise Attendance Report',
  subTitle: string = `Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
) {
  const doc = new jsPDF('landscape', 'pt', 'a4');

  // Header Banner
  doc.setFillColor(15, 23, 42); // Navy Blue / Slate 900
  doc.rect(0, 0, 842, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SmartFace AI - Attendance Management System', 40, 36);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('CONFIDENTIAL & OFFICIAL RECORD', 802, 36, { align: 'right' });

  // Subtitle & Report Metadata
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle, 40, 85);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(subTitle, 40, 102);

  // Summary Metrics Bar
  const total = records.length;
  const present = records.filter((r) => r.status === 'PRESENT').length;
  const late = records.filter((r) => r.status === 'LATE').length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(40, 115, 762, 35, 4, 4, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Records: ${total}   |   Present: ${present}   |   Late: ${late}   |   Attendance Rate: ${rate}%`, 55, 137);

  // Table Data
  const tableData = records.map((rec, idx) => [
    idx + 1,
    rec.studentId,
    rec.studentName,
    rec.department,
    `${rec.year} / ${rec.section}`,
    rec.date,
    rec.time,
    rec.status,
    `${rec.confidence}%`,
    rec.deviceId,
  ]);

  autoTable(doc, {
    startY: 165,
    head: [['#', 'Student ID', 'Full Name', 'Department', 'Yr/Sec', 'Date', 'Time', 'Status', 'Confidence', 'Device Kiosk']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138], // Enterprise Blue
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 30 },
      1: { halign: 'center', cellWidth: 70 },
      2: { cellWidth: 120 },
      3: { cellWidth: 100 },
      4: { halign: 'center', cellWidth: 60 },
      5: { halign: 'center', cellWidth: 75 },
      6: { halign: 'center', cellWidth: 65 },
      7: { halign: 'center', cellWidth: 65 },
      8: { halign: 'center', cellWidth: 70 },
      9: { cellWidth: 100 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        if (data.cell.raw === 'PRESENT') {
          data.cell.styles.textColor = [22, 101, 52]; // Green
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'LATE') {
          data.cell.styles.textColor = [194, 65, 12]; // Orange
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [185, 28, 28]; // Red
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount} - SmartFace AI Enterprise v2.4.0`, 40, 575);
    doc.text(`Verified Facial Recognition Audit Record`, 802, 575, { align: 'right' });
  }

  doc.save(`SmartFace_Attendance_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Export Attendance Records to Excel (XLSX)
 */
export function exportAttendanceToExcel(records: AttendanceRecord[], fileName: string = 'SmartFace_Attendance_Report') {
  const worksheetData = records.map((rec, index) => ({
    'S.No': index + 1,
    'Student ID': rec.studentId,
    'Student Name': rec.studentName,
    Department: rec.department,
    Year: rec.year,
    Section: rec.section,
    Date: rec.date,
    Time: rec.time,
    Status: rec.status,
    'Recognition Confidence (%)': rec.confidence,
    'Kiosk Device': rec.deviceId,
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');

  // Summary Sheet
  const total = records.length;
  const present = records.filter((r) => r.status === 'PRESENT').length;
  const late = records.filter((r) => r.status === 'LATE').length;
  const absent = records.filter((r) => r.status === 'ABSENT').length;
  const rate = total > 0 ? ((present + late) / total) * 100 : 0;

  const summaryData = [
    { Metric: 'Report Generated At', Value: new Date().toLocaleString() },
    { Metric: 'Total Recorded Logs', Value: total },
    { Metric: 'Present Students', Value: present },
    { Metric: 'Late Students', Value: late },
    { Metric: 'Absent Students', Value: absent },
    { Metric: 'Attendance Rate (%)', Value: `${rate.toFixed(1)}%` },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export Attendance Records to CSV format
 */
export function exportAttendanceToCSV(records: AttendanceRecord[], fileName: string = 'SmartFace_Attendance_Data') {
  const headers = ['S.No', 'Student ID', 'Student Name', 'Department', 'Year', 'Section', 'Date', 'Time', 'Status', 'Confidence', 'Device ID'];

  const rows = records.map((rec, idx) => [
    idx + 1,
    `"${rec.studentId}"`,
    `"${rec.studentName.replace(/"/g, '""')}"`,
    `"${rec.department.replace(/"/g, '""')}"`,
    `"${rec.year}"`,
    `"${rec.section}"`,
    `"${rec.date}"`,
    `"${rec.time}"`,
    `"${rec.status}"`,
    `"${rec.confidence}%"`,
    `"${rec.deviceId}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
