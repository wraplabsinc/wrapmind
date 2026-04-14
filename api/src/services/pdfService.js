const PDFDocument = require('pdfkit');
const config = require('../config');

function generateEstimatePDF(estimate, settings) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const shopName = settings?.shop_name || 'Wrap Labs';
    const shopAddress = settings?.address || '';
    const shopPhone = settings?.phone || '';

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text(shopName, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(shopAddress, { align: 'center' });
    doc.text(shopPhone, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(18).text('Vehicle Customization Estimate', { align: 'center' });
    doc.moveDown(0.5);

    // Estimate info
    doc.fontSize(12).font('Helvetica-Bold').text(`Estimate ID: ${estimate.estimate_id}`);
    doc.text(`Date: ${new Date(estimate.created_at).toLocaleDateString()}`);
    doc.text(`Expires: ${new Date(estimate.expires_at).toLocaleDateString()}`);
    doc.text(`Status: ${estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}`);
    doc.moveDown(1);

    // Vehicle info
    doc.fontSize(14).font('Helvetica-Bold').text('Vehicle');
    doc.fontSize(11).font('Helvetica');
    const v = estimate.vehicle_json || {};
    doc.text(`${v.year || ''} ${v.make || ''} ${v.model || ''}`);
    if (v.color) doc.text(`Color: ${v.color}`);
    if (v.complexity_tier) doc.text(`Complexity: Tier ${v.complexity_tier}`);
    doc.moveDown(0.5);

    // Client info
    if (estimate.client) {
      doc.fontSize(14).font('Helvetica-Bold').text('Client');
      doc.fontSize(11).font('Helvetica');
      doc.text(`${estimate.client.first_name} ${estimate.client.last_name}`);
      if (estimate.client.phone) doc.text(`Phone: ${estimate.client.phone}`);
      if (estimate.client.email) doc.text(`Email: ${estimate.client.email}`);
      doc.moveDown(0.5);
    }

    // Line items
    doc.fontSize(14).font('Helvetica-Bold').text('Line Items');
    doc.moveDown(0.5);

    const lineItems = estimate.line_items_json || [];
    for (const item of lineItems) {
      doc.fontSize(11).font('Helvetica-Bold').text(item.service || item.description);
      doc.fontSize(10).font('Helvetica');
      if (item.type === 'labor') {
        doc.text(`Labor: ${item.labor_hours} hrs @ $${item.labor_rate || 0}/hr = $${item.labor_cost}`);
      } else if (item.type === 'material') {
        doc.text(`Material: $${item.material_cost}`);
      } else if (item.type === 'discount') {
        doc.text(`Discount: -$${item.amount}`);
      } else if (item.type === 'surcharge') {
        doc.text(`Surcharge: $${item.amount}`);
      } else if (item.type === 'fee') {
        doc.text(`${item.description}: $${item.amount}`);
      }
    }

    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Subtotal: $${estimate.subtotal}`);
    doc.text(`Tax: $${estimate.tax}`);
    doc.fontSize(14).text(`Total: $${estimate.total}`);
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Deposit Required (50%): $${estimate.deposit_amount}`);

    // Technician notes
    if (estimate.details_json?.notes) {
      doc.moveDown(1);
      doc.fontSize(12).font('Helvetica-Bold').text('Notes');
      doc.fontSize(10).font('Helvetica').text(estimate.details_json.notes);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').text(
      `Powered by WrapIQ | Generated on ${new Date().toLocaleString()}`,
      { align: 'center' }
    );

    doc.end();
  });
}

module.exports = { generateEstimatePDF };
