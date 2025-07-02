import React, { Component } from "react";
import "./Menu.css";
import * as AppGeneral from "../socialcalc/AppGeneral";
import { File, Local } from "../storage/LocalStorage.js";
import { DATA } from "../app-data.js";

class Menu extends Component {
  constructor(props) {
    super(props);
    this.store = new Local(this.props.file);
    this.state = {
      showExportOptions: false,
      exportFormat: 'pdf' // default to PDF
    };
    this.menuRef = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  handleClickOutside = (event) => {
    if (this.menuRef.current && !this.menuRef.current.contains(event.target)) {
      this.setState({ showExportOptions: false });
    }
  }

  doPrint() {
    const content = AppGeneral.getCurrentHTMLContent();

    // Check if content exists
    if (!content || content.trim() === '') {
      window.alert('No content to print. Please make sure your spreadsheet has data.');
      return;
    }

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
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
          </html>
        `);
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = function () {
          printWindow.focus();
          printWindow.print();
          // Close after a delay to ensure printing completes
          setTimeout(() => {
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

  printFallback(content) {
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
        }
      </style>
      <div class="print-content">${content}</div>
    `;
    printDiv.style.display = 'none';

    // Add to body
    document.body.appendChild(printDiv);

    // Print
    window.print();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(printDiv);
    }, 1000);
  }

  doSave() {
    if (this.props.file === "default") {
      window.alert(`Cannot update ${this.props.file} file! `);
      return;
    }
    const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
    const data = this.store._getFile(this.props.file);
    const file = new File(
      data.created,
      new Date().toString(),
      content,
      this.props.file
    );
    this.store._saveFile(file);
    this.props.updateSelectedFile(this.props.file);
    window.alert(`File ${this.props.file} updated successfully! `);
  }

  doSaveAs() {
    event.preventDefault();
    const filename = window.prompt("Enter filename : ");
    if (filename) {
      if (this._validateName(filename)) {
        // filename valid . go on save
        const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
        // console.log(content);
        const file = new File(
          new Date().toString(),
          new Date().toString(),
          content,
          filename
        );
        // const data = { created: file.created, modified: file.modified, content: file.content, password: file.password };
        // console.log(JSON.stringify(data));
        this.store._saveFile(file);
        this.props.updateSelectedFile(filename);
        window.alert(`File ${filename} saved successfully! `);
      } else {
        window.alert(`Filename cannot be ${this.props.file}`);
      }
    }
  }

  newFile() {
    if (this.props.file !== "default") {
      const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
      const data = this.store._getFile(this.props.file);
      const file = new File(
        data.created,
        new Date().toString(),
        content,
        this.props.file
      );
      this.store._saveFile(file);
      this.props.updateSelectedFile(this.props.file);
    }
    const msc = DATA["home"][AppGeneral.getDeviceType()]["msc"];
    AppGeneral.viewFile("default", JSON.stringify(msc));
    this.props.updateSelectedFile("default");
  }

  exportAs() {
    this.setState(prevState => ({
      showExportOptions: !prevState.showExportOptions
    }));
  }

  handleExportFormatChange = (format) => {
    this.setState({ exportFormat: format });
  }

  executeExport = () => {
    const { exportFormat } = this.state;
    const filename = this.props.file !== 'default' ? this.props.file : 'spreadsheet';

    if (exportFormat === 'pdf') {
      this.exportAsPDF(filename);
    } else if (exportFormat === 'csv') {
      this.exportAsCSV(filename);
    }

    // Close the export options after export
    this.setState({ showExportOptions: false });
  }

  exportAsPDF(filename) {
    try {
      const content = AppGeneral.getCurrentHTMLContent();

      if (!content || content.trim() === '') {
        window.alert('No content to export. Please make sure your spreadsheet has data.');
        return;
      }

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
              // table { 
              //   border-collapse: collapse; 
              //   width: 100%; 
              //   margin: 20px 0;
              // }
              // td, th { 
              //   border: 1px solid #333; 
              //   padding: 8px; 
              //   text-align: left; 
              //   font-size: 12px;
              // }
              // th {
              //   background-color: #f5f5f5;
              //   font-weight: bold;
              // }
              @media print {
                body { margin: 0; }
                @page { size: A4; margin: 0.5in; }
              }
            </style>
          </head>
          <body>
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
      } else {
        window.alert("Please allow popups for this site to export as PDF. Use your browser's print dialog to save as PDF.");
        window.print(); src / Menu / Menu.css
      }
    } catch (error) {
      console.error('PDF export error:', error);
      window.alert('Error exporting PDF. Please try again or use the print button.');
    }
  }

  exportAsCSV(filename) {
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

  render() {
    const { showExportOptions, exportFormat } = this.state;

    return (
      <div className="Menu" ref={this.menuRef}>
        <button onClick={() => this.doSave()}> Save </button>
        <button onClick={() => this.doSaveAs()}> Save As </button>
        <button onClick={() => this.doPrint()}> Print </button>
        <button onClick={() => this.newFile()}> New File </button>
        <button onClick={() => this.exportAs()}> Export As </button>

        {showExportOptions && (
          <div className="export-options">
            <div className="export-format-selection">
              <h4>Choose Export Format:</h4>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={() => this.handleExportFormatChange('pdf')}
                  />
                  <span>PDF</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={() => this.handleExportFormatChange('csv')}
                  />
                  <span>CSV</span>
                </label>
              </div>
              <div className="export-actions">
                <button
                  className="export-btn"
                  onClick={this.executeExport}
                >
                  Export {exportFormat.toUpperCase()}
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => this.setState({ showExportOptions: false })}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* Utility functions */
  _validateName(filename) {
    filename = filename.trim();
    if (filename === "default" || filename === "Untitled") {
      // return 'Cannot update default file!';
      return false;
    } else if (filename === "" || !filename) {
      // this.showToast('Filename cannot be empty');
      return false;
    } else if (filename.length > 30) {
      // this.showToast('Filename too long');
      return false;
    } else if (/^[a-zA-Z0-9- ]*$/.test(filename) === false) {
      // this.showToast('Special Characters cannot be used');
      return false;
    }
    return true;
  }

  _formatString(filename) {
    /* Remove whitespaces */
    while (filename.indexOf(" ") !== -1) {
      filename = filename.replace(" ", "");
    }
    return filename;
  }
}

export default Menu;
