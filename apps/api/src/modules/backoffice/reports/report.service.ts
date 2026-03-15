import { prisma } from '../../../config/database.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import type { OrderStatus } from '../../../generated/prisma/client.js';

// Bangkok is UTC+7
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Returns UTC Date boundaries for a Bangkok-local date string.
 * e.g. "2026-03-15" → startUTC = 2026-03-14T17:00:00Z, endUTC = 2026-03-15T17:00:00Z
 */
function buildBangkokDayRange(dateStr: string): { gte: Date; lt: Date } {
  // Parse as midnight Bangkok local, then convert to UTC by subtracting offset
  const [year, month, day] = dateStr.split('-').map(Number);
  // Midnight Bangkok = midnight UTC minus 7 hours → previous day 17:00 UTC
  const startUtc = new Date(Date.UTC(year!, month! - 1, day!) - BANGKOK_OFFSET_MS);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { gte: startUtc, lt: endUtc };
}

/** Returns today's date string in Bangkok timezone (YYYY-MM-DD) */
function todayBangkok(): string {
  const now = new Date();
  const bangkokTime = new Date(now.getTime() + BANGKOK_OFFSET_MS);
  return bangkokTime.toISOString().slice(0, 10);
}

interface StatusCount {
  status: string;
  count: number;
}

interface PaymentMethodCount {
  paymentMethod: string;
  count: number;
}

interface DailySalesItem {
  orderId: number;
  orderNumber: string;
  customerName: string;
  paymentMethod: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
}

interface DailySalesResult {
  date: string;
  totalOrders: number;
  completedRevenue: number;
  pendingRevenue: number;
  ordersByStatus: StatusCount[];
  ordersByPaymentMethod: PaymentMethodCount[];
  items: DailySalesItem[];
}

export async function getDailySales(dateParam?: string): Promise<DailySalesResult> {
  const date = dateParam ?? todayBangkok();
  const range = buildBangkokDayRange(date);
  const where = { createdAt: range };

  const [totalOrders, completedAgg, pendingAgg, statusGroups, methodGroups, orders] =
    await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where: { ...where, status: 'DELIVERED' as OrderStatus },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: {
          ...where,
          status: { notIn: ['REJECTED', 'CANCELLED'] as OrderStatus[] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      prisma.order.groupBy({
        by: ['paymentMethod'],
        where,
        _count: { _all: true },
      }),
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          paymentMethod: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          user: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

  return {
    date,
    totalOrders,
    completedRevenue: Number(completedAgg._sum.totalAmount ?? 0),
    pendingRevenue: Number(pendingAgg._sum.totalAmount ?? 0),
    ordersByStatus: statusGroups.map((g) => ({
      status: g.status,
      count: g._count._all,
    })),
    ordersByPaymentMethod: methodGroups.map((g) => ({
      paymentMethod: g.paymentMethod,
      count: g._count._all,
    })),
    items: orders.map((o) => ({
      orderId: o.id,
      orderNumber: o.orderNumber,
      customerName: `${o.user.firstName} ${o.user.lastName}`,
      paymentMethod: o.paymentMethod,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt,
    })),
  };
}

export async function generateDailySalesExcel(dateParam?: string): Promise<Buffer> {
  const sales = await getDailySales(dateParam);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Daily Sales');

  sheet.columns = [
    { header: 'Order #', key: 'orderNumber', width: 20 },
    { header: 'Customer', key: 'customerName', width: 25 },
    { header: 'Payment Method', key: 'paymentMethod', width: 18 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Total (฿)', key: 'totalAmount', width: 15 },
    { header: 'Created At', key: 'createdAt', width: 22 },
  ];

  // Bold header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  // Currency format for total column
  sheet.getColumn('totalAmount').numFmt = '#,##0.00';

  for (const item of sales.items) {
    sheet.addRow({
      orderNumber: item.orderNumber,
      customerName: item.customerName,
      paymentMethod: item.paymentMethod,
      status: item.status,
      totalAmount: item.totalAmount,
      createdAt: item.createdAt,
    });
  }

  // Summary row
  sheet.addRow({});
  sheet.addRow({
    orderNumber: `Total Orders: ${sales.totalOrders}`,
    totalAmount: sales.pendingRevenue,
  });
  sheet.addRow({
    orderNumber: `Completed Revenue:`,
    totalAmount: sales.completedRevenue,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function generateDailySalesPdf(dateParam?: string): Promise<Buffer> {
  const sales = await getDailySales(dateParam);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err: Error) => reject(err));

    // Title
    doc.fontSize(18).font('Helvetica-Bold').text(`Daily Sales Report — ${sales.date}`, {
      align: 'center',
    });
    doc.moveDown();

    // Summary
    doc.fontSize(12).font('Helvetica');
    doc.text(`Total Orders: ${sales.totalOrders}`);
    doc.text(`Pending Revenue: ฿${sales.pendingRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.text(`Completed Revenue: ฿${sales.completedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.moveDown();

    // Status breakdown
    if (sales.ordersByStatus.length > 0) {
      doc.font('Helvetica-Bold').text('Orders by Status:');
      doc.font('Helvetica');
      for (const s of sales.ordersByStatus) {
        doc.text(`  ${s.status}: ${s.count}`);
      }
      doc.moveDown();
    }

    // Table header
    const tableTop = doc.y;
    const colX = [50, 150, 280, 370, 460];

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Order #', colX[0]!, tableTop);
    doc.text('Customer', colX[1]!, tableTop);
    doc.text('Payment', colX[2]!, tableTop);
    doc.text('Status', colX[3]!, tableTop);
    doc.text('Total (฿)', colX[4]!, tableTop);

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(545, tableTop + 15)
      .stroke();

    // Table rows
    doc.font('Helvetica').fontSize(9);
    let rowY = tableTop + 22;

    for (const item of sales.items) {
      if (rowY > 750) {
        doc.addPage();
        rowY = 50;
      }

      doc.text(item.orderNumber, colX[0]!, rowY, { width: 95 });
      doc.text(item.customerName, colX[1]!, rowY, { width: 125 });
      doc.text(item.paymentMethod, colX[2]!, rowY, { width: 85 });
      doc.text(item.status, colX[3]!, rowY, { width: 85 });
      doc.text(item.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }), colX[4]!, rowY, { width: 80 });

      rowY += 18;
    }

    doc.end();
  });
}
