import React, { useState, useRef } from "react";
import "./Menu.css";
import * as AppGeneral from "../socialcalc/AppGeneral";
import { File, Local } from "../storage/LocalStorage.js";
import { DATA } from "../app-data.js";

const Menu = ({ file, updateSelectedFile, userLogo }) => {
  const [exportFormat, setExportFormat] = useState('');
  const storeRef = useRef(new Local(file));



  const createLogoHTML = () => {
    if (!userLogo?.url) return '';
    return `
      <div style="margin-bottom: 20px; text-align: left;">
        <img src="${userLogo.url}" alt="Company Logo" style="max-width: 150px; max-height: 75px; object-fit: contain;" />
      </div>
    `;
  };

  const doPrint = () => {
    const content = AppGeneral.getCurrentHTMLContent();

    // Check if content exists
    if (!content || content.trim() === '') {
      window.alert('No content to print. Please make sure your spreadsheet has data.');
      return;
    }

    const logoHTML = createLogoHTML();

    // Try the popup approach first
    try {
      var printWindow = window.open("", "_blank", "width=800,height=600,scrollbars=yes,resizable=yes");

      if (printWindow && !printWindow.closed) {
        // Popup was allowed - use popup method
        printWindow.document.open();
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Print Preview</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { border-collapse: collapse; width: 100%; }
              td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .logo-header { margin-bottom: 20px; }
              .logo-header img { max-width: 150px; max-height: 75px; object-fit: contain; }
              @media print {
                body { margin: 0; }
                .logo-header img { max-width: 120px; max-height: 60px; }
              }
            </style>
          </head>
          <body>
            ${logoHTML}
            ${content}
          </body>
          </html>
        `);
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = function () {
          console.log("printWindow.onload");
          printWindow.focus();
          printWindow.print();
          // Close after a delay to ensure printing completes
          setTimeout(() => {
            console.log("printWindow.close()");
            printWindow.close();
          }, 1000);
        };
      } else {
        throw new Error("Popup blocked");
      }
    } catch (error) {
      // Notify user about popup blocker and use fallback
      console.log("Print popup was blocked, using fallback method");
      window.alert("Your browser blocked the print popup. Using alternative print method. If printing doesn't work, please allow popups for this site and try again.");
      this.printFallback(content);
    }
  }

  const printFallback = (content) => {
    const logoHTML = createLogoHTML();
    
    // Create a hidden div with the content
    const printDiv = document.createElement('div');
    printDiv.innerHTML = `
      <style>
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .logo-header img { max-width: 120px; max-height: 60px; object-fit: contain; }
        }
      </style>
      <div class="print-content">${logoHTML}${content}</div>
    `;
    printDiv.style.display = 'none';

    // Add to body
    document.body.appendChild(printDiv);

    // Print
    window.print();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(printDiv);
      console.log("printFallback");
    }, 1000);
  }

  const doSave = () => {
    if (file === "default") {
      window.alert(`Cannot update ${file} file! `);
      return;
    }
    const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
    const data = storeRef.current._getFile(file);
    const fileObj = new File(
      data.created,
      new Date().toString(),
      content,
      file
    );
    storeRef.current._saveFile(fileObj);
    updateSelectedFile(file);
    window.alert(`File ${file} updated successfully! `);
  };

  const doSaveAs = (event) => {
    event.preventDefault();
    const filename = window.prompt("Enter filename : ");
    if (filename) {
      if (validateName(filename)) {
        const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
        const fileObj = new File(
          new Date().toString(),
          new Date().toString(),
          content,
          filename
        );
        storeRef.current._saveFile(fileObj);
        updateSelectedFile(filename);
        window.alert(`File ${filename} saved successfully! `);
      } else {
        window.alert(`Filename cannot be ${file}`);
      }
    }
  };

  const newFile = () => {
    if (file !== "default") {
      const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
      const data = storeRef.current._getFile(file);
      const fileObj = new File(
        data.created,
        new Date().toString(),
        content,
        file
      );
      storeRef.current._saveFile(fileObj);
      updateSelectedFile(file);
    }
    const msc = DATA["home"][AppGeneral.getDeviceType()]["msc"];
    AppGeneral.viewFile("default", JSON.stringify(msc));
    updateSelectedFile("default");
  };

  const handleExportChange = (event) => {
    const format = event.target.value;
    event.target.value = '';
    setExportFormat(format);

    if (format !== '') {
      const filename = file !== 'default' ? file : 'spreadsheet';

      if (format === 'pdf') {
        exportAsPDF(filename);
      } else if (format === 'csv') {
        exportAsCSV(filename);
      }

      setTimeout(() => {
        setExportFormat('');
      }, 100);
    }
  };

  const exportAsPDF = (filename) => {
    try {
      const content = AppGeneral.getCurrentHTMLContent();

      if (!content || content.trim() === '') {
        window.alert('No content to export. Please make sure your spreadsheet has data.');
        return;
      }

      const logoHTML = createLogoHTML();

      // Create a new window for PDF generation
      const printWindow = window.open("", "_blank", "width=800,height=600");

      if (printWindow && !printWindow.closed) {
        printWindow.document.open();
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${filename}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                color: #000;
              }
              .logo-header { margin-bottom: 20px; }
              .logo-header img { max-width: 150px; max-height: 75px; object-fit: contain; }
              table { border-collapse: collapse; width: 100%; }
              td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
              
              @media print {
                body { margin: 0; }
                @page { size: A4; margin: 0.5in; }
                .logo-header img { max-width: 120px; max-height: 60px; }
              }
            </style>
          </head>
          <body>
            ${logoHTML}
            ${content}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
        console.log("printWindow.document.close()");

      } else {
        window.alert("Please allow popups for this site to export as PDF. Use your browser's print dialog to save as PDF.");
        window.print();
      }
    } catch (error) {
      console.error('PDF export error:', error);
      window.alert('Error exporting PDF. Please try again or use the print button.');
    }
  }

  const exportAsCSV = (filename) => {
    try {
      const csvContent = AppGeneral.getCSVContent();

      if (!csvContent || csvContent.trim() === '') {
        window.alert('No content to export. Please make sure your spreadsheet has data.');
        return;
      }

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Fallback for older browsers
        window.alert('CSV download not supported in this browser. Please copy the data manually.');
      }
    } catch (error) {
      console.error('CSV export error:', error);
      window.alert('Error exporting CSV. Please try again.');
    }
  }

  const validateName = (filename) => {
    filename = filename.trim();
    if (filename === "default" || filename === "Untitled") {
      return false;
    } else if (filename === "" || !filename) {
      return false;
    } else if (filename.length > 30) {
      return false;
    } else if (/^[a-zA-Z0-9- ]*$/.test(filename) === false) {
      return false;
    }
    return true;
  };

  const formatString = (filename) => {
    while (filename.indexOf(" ") !== -1) {
      filename = filename.replace(" ", "");
    }
    return filename;
  };

  return (
    <div className="Menu">
      <button onClick={doSave}> Save </button>
      <button onClick={doSaveAs}> Save As </button>
      <button onClick={doPrint}> Print </button>
      <button onClick={newFile}> New File </button>
      <select
        value={exportFormat}
        onChange={handleExportChange}
        className="export-select"
      >
        <option value="">Export As...</option>
        <option value="pdf">Export as PDF</option>
        <option value="csv">Export as CSV</option>
      </select>
    </div>
  );

};

export default Menu;
