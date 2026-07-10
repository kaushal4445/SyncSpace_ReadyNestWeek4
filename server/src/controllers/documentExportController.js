const PDFDocument = require("pdfkit");
const Document = require("../models/Document");

// @desc   Export a document's current content as a downloadable PDF
// @route  GET /api/documents/:id/export-pdf
const exportDocumentPdf = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, "_")}.pdf"`
    );

    const pdf = new PDFDocument({ margin: 50 });
    pdf.pipe(res);

    pdf.fontSize(20).text(document.title, { underline: true });
    pdf.moveDown();
    pdf.fontSize(12).text(document.content || "", { align: "left" });

    pdf.end();
  } catch (error) {
    next(error);
  }
};

module.exports = { exportDocumentPdf };
