/** Props for PDF render/viewer component */
export interface PdfRenderProps {
  /** Controls whether the PDF viewer is shown */
  visible: boolean;

  /** Optional callback fired when viewer is closed */
  onClose?: () => void;

  /** PDF file URL to render */
  pdfUrl: string;
}
