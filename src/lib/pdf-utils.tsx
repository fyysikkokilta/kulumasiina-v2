import { PDFDocument, StandardFonts } from '@cantoo/pdf-lib'
import { Document, Image, Page, renderToBuffer, StyleSheet, Text, View } from '@react-pdf/renderer'
import { compress } from 'compress-pdf'
import fs from 'fs/promises'
import path from 'path'
import React from 'react'
import sharp from 'sharp'

import type { EntryWithItemsAndMileages } from './db/schema'
import { env } from './env'
import { getFile } from './storage'
import { isPdf } from './validation'

// Helper function to format dates in Finnish timezone
function formatDateInFinnishTimezone(date: Date): string {
  return date.toLocaleDateString('fi-FI', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

interface AttachmentData {
  data: Buffer
  mimeType: string
  value: number | null
  isNotReceipt: boolean
  filename: string | null
  attachmentNum: number
}

interface PartData {
  date: Date
  description: string
  price: number
  attachments: AttachmentData[]
}

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 50,
    fontFamily: 'Helvetica'
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1
  },
  watermark: {
    width: 500,
    height: 500,
    opacity: 0.05
  },
  content: {
    position: 'relative',
    zIndex: 1
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#000000'
  },
  infoBlock: {
    fontSize: 15,
    marginBottom: 5,
    color: '#333333'
  },
  statusBlock: {
    fontSize: 15,
    marginBottom: 5,
    color: '#333333'
  },
  reasonBlock: {
    fontSize: 12,
    marginTop: 10,
    marginBottom: 30,
    color: '#333333',
    lineHeight: 1.4
  },
  table: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 2,
    borderBottomColor: '#d0d0d0',
    paddingVertical: 10
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
    minHeight: 35
  },
  tableRowEven: {
    backgroundColor: '#fafafa'
  },
  tableRowLast: {
    borderBottomWidth: 0
  },
  tableCol1: {
    width: '15%',
    paddingHorizontal: 10
  },
  tableCol2: {
    width: '45%',
    paddingHorizontal: 10
  },
  tableCol3: {
    width: '20%',
    paddingHorizontal: 10
  },
  tableCol4: {
    width: '20%',
    paddingHorizontal: 10,
    alignItems: 'flex-end'
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333'
  },
  tableCellText: {
    fontSize: 11,
    color: '#444444',
    lineHeight: 1.3
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#e8e8e8',
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: '#d0d0d0',
    marginTop: -1
  },
  totalLabel: {
    width: '80%',
    paddingHorizontal: 10
  },
  totalLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333'
  },
  totalAmount: {
    width: '20%',
    paddingHorizontal: 10,
    alignItems: 'flex-end'
  },
  totalAmountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333'
  },
  attachmentPage: {
    padding: 40,
    fontFamily: 'Helvetica'
  },
  attachmentLabel: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#333333'
  },
  attachmentImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  attachmentImage: {
    maxWidth: 515,
    maxHeight: 700,
    objectFit: 'contain'
  }
})

async function convertToPng(imageData: Buffer) {
  return await sharp(imageData).toFormat('png').toBuffer()
}

const LOGO_SVG_PATH = path.join(process.cwd(), 'src/assets/fii_2.svg')

// PDF Document Component
const ExpensePDF = ({
  status,
  name,
  iban,
  govId,
  submissionDate,
  title,
  parts,
  approvalNote,
  approvalDate,
  paidDate,
  rejectionDate,
  logoData
}: {
  status: 'approved' | 'paid' | 'submitted' | 'denied'
  name: string
  iban: string
  govId: string | null
  submissionDate: Date
  title: string
  parts: PartData[]
  approvalNote: string | null
  approvalDate: Date | null
  paidDate: Date | null
  rejectionDate: Date | null
  logoData?: string
}) => {
  const now = new Date()
  const tableHeaders = govId
    ? ['Pvm', 'Selite', 'Kilometrikorvaus', 'Hinta']
    : ['Pvm', 'Selite', 'Liitteet', 'Hinta']

  const total = parts.reduce((sum, part) => sum + part.price, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        {logoData && (
          <View fixed style={styles.watermarkContainer}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={styles.watermark} src={logoData} />
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <Text style={styles.header}>
            {govId
              ? 'FYYSIKKOKILTA RY - Matkakorvauslomake'
              : 'FYYSIKKOKILTA RY - Kulukorvauslomake'}
          </Text>

          {/* Info block */}
          <Text style={styles.infoBlock}>Nimi: {name}</Text>
          <Text style={styles.infoBlock}>IBAN: {iban}</Text>
          {govId && <Text style={styles.infoBlock}>Henkilötunnus: {govId}</Text>}
          <Text style={styles.infoBlock}>
            Päivämäärä: {submissionDate.toLocaleDateString('fi-FI')}
          </Text>

          {/* Status block */}
          <View style={styles.statusBlock}>
            {status === 'approved' && approvalDate && approvalNote && (
              <React.Fragment>
                <Text>
                  Hyväksytty ({formatDateInFinnishTimezone(approvalDate)}), peruste: {approvalNote}
                </Text>
                <Text>Ei maksettu ({formatDateInFinnishTimezone(now)})</Text>
              </React.Fragment>
            )}
            {status === 'paid' && approvalDate && approvalNote && paidDate && (
              <React.Fragment>
                <Text>
                  Hyväksytty ({formatDateInFinnishTimezone(approvalDate)}), peruste: {approvalNote}
                </Text>
                <Text>Maksettu ({formatDateInFinnishTimezone(paidDate)})</Text>
              </React.Fragment>
            )}
            {status === 'submitted' && (
              <Text>Odottaa hyväksyntää ({formatDateInFinnishTimezone(now)})</Text>
            )}
            {status === 'denied' && rejectionDate && (
              <Text>Hylätty ({formatDateInFinnishTimezone(rejectionDate)})</Text>
            )}
          </View>

          {/* Reason block */}
          <Text style={styles.reasonBlock}>Korvauksen peruste: {title}</Text>

          {/* Table */}
          <View style={styles.table}>
            {/* Header row */}
            <View style={styles.tableHeader}>
              <View style={styles.tableCol1}>
                <Text style={styles.tableHeaderText}>{tableHeaders[0]}</Text>
              </View>
              <View style={styles.tableCol2}>
                <Text style={styles.tableHeaderText}>{tableHeaders[1]}</Text>
              </View>
              <View style={styles.tableCol3}>
                <Text style={styles.tableHeaderText}>{tableHeaders[2]}</Text>
              </View>
              <View style={styles.tableCol4}>
                <Text style={styles.tableHeaderText}>{tableHeaders[3]}</Text>
              </View>
            </View>

            {/* Data rows */}
            {parts.map((part, index) => {
              const attachmentNumbers = part.attachments.map((att) => att.attachmentNum).join(', ')

              return (
                <View
                  key={index}
                  style={[
                    styles.tableRow,
                    index % 2 === 1 ? styles.tableRowEven : {},
                    index === parts.length - 1 ? styles.tableRowLast : {}
                  ]}
                >
                  <View style={styles.tableCol1}>
                    <Text style={styles.tableCellText}>
                      {part.date.toLocaleDateString('fi-FI')}
                    </Text>
                  </View>
                  <View style={styles.tableCol2}>
                    <Text style={styles.tableCellText}>{part.description}</Text>
                  </View>
                  <View style={styles.tableCol3}>
                    <Text style={styles.tableCellText}>
                      {govId
                        ? `${env.NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE} €/km`
                        : attachmentNumbers || '-'}
                    </Text>
                  </View>
                  <View style={styles.tableCol4}>
                    <Text style={styles.tableCellText}>{part.price.toFixed(2)} €</Text>
                  </View>
                </View>
              )
            })}

            {/* Total row */}
            <View style={styles.totalRow}>
              <View style={styles.totalLabel}>
                <Text style={styles.totalLabelText}>Yhteensä</Text>
              </View>
              <View style={styles.totalAmount}>
                <Text style={styles.totalAmountText}>{total.toFixed(2)} €</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* Image attachment pages */}
      {parts.flatMap((part, partIndex) => {
        return part.attachments.map((attachment, attIndex) => {
          const showPrice = attachment.value !== null && !attachment.isNotReceipt
          const priceText = showPrice ? `: ${attachment.value!.toFixed(2)} €` : ''
          const label = `Liite ${attachment.attachmentNum}${priceText}`

          // Here every attachment is a PNG
          const imageData = `data:image/png;base64,${attachment.data.toString('base64')}`

          return (
            <Page key={`${partIndex}-${attIndex}`} size="A4" style={styles.attachmentPage}>
              <Text style={styles.attachmentLabel}>{label}</Text>
              <View style={styles.attachmentImageContainer}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image style={styles.attachmentImage} src={imageData} />
              </View>
            </Page>
          )
        })
      })}
    </Document>
  )
}

export async function generateCombinedPDF(
  entryId: string,
  status: 'approved' | 'paid' | 'submitted' | 'denied',
  name: string,
  iban: string,
  govId: string | null,
  submissionDate: Date,
  title: string,
  parts: PartData[],
  approvalNote: string | null,
  approvalDate: Date | null,
  paidDate: Date | null,
  rejectionDate: Date | null
) {
  // Process attachments, separating PDFs from images
  const partsWithImages: PartData[] = []
  const pdfAttachments: AttachmentData[] = []

  for (const part of parts) {
    const imageAttachments: AttachmentData[] = []
    for (const att of part.attachments) {
      if (att.data && att.mimeType === 'application/pdf') {
        // Keep PDF attachments separate for later merging
        pdfAttachments.push(att)
      }
      if (att.data && att.mimeType.startsWith('image/')) {
        imageAttachments.push(att)
      }
    }
    partsWithImages.push({
      ...part,
      attachments: imageAttachments
    })
  }

  // Try to load logo
  let logoData: string | undefined
  try {
    const logoSvgData = await fs.readFile(LOGO_SVG_PATH)
    const logoPngData = await sharp(logoSvgData).resize(400, 400).toFormat('png').toBuffer()
    logoData = `data:image/png;base64,${logoPngData.toString('base64')}`
  } catch (e) {
    console.error('Error loading logo:', e)
  }

  // Generate main PDF with overview and image attachments using React PDF
  const mainPdfBuffer = await renderToBuffer(
    <ExpensePDF
      status={status}
      name={name}
      iban={iban}
      govId={govId}
      submissionDate={submissionDate}
      title={title}
      parts={partsWithImages}
      approvalNote={approvalNote}
      approvalDate={approvalDate}
      paidDate={paidDate}
      rejectionDate={rejectionDate}
      logoData={logoData}
    />
  )

  // If there are no PDF attachments, return the main PDF
  if (pdfAttachments.length === 0) {
    const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '_')
    const filenameDateStr = submissionDate.toLocaleDateString('fi-FI').replace(/\./g, '-')
    const filename = `${sanitizedName}-${filenameDateStr}-${entryId}.pdf`

    return {
      filename,
      data: Buffer.from(mainPdfBuffer)
    }
  }

  // Use pdf-lib to merge PDF attachments at the correct positions
  const mainPdfDoc = await PDFDocument.load(mainPdfBuffer)
  const totalPages = mainPdfDoc.getPageCount()
  const imageAttachments = partsWithImages.flatMap((part) => part.attachments).length
  const overviewPages = totalPages - imageAttachments

  // Calculate where to insert PDF attachments
  // PDF attachments should be inserted after image attachments but before the next part's attachments
  let pdfPageOffset = 0

  const helveticaFont = await mainPdfDoc.embedFont(StandardFonts.HelveticaBold)
  for (const pdfAtt of pdfAttachments) {
    const pdfDoc = await PDFDocument.load(pdfAtt.data)
    const pdfPages = await mainPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices())

    const showPrice = pdfAtt.value !== null && !pdfAtt.isNotReceipt
    const priceText = showPrice ? `: ${pdfAtt.value!.toFixed(2)} €` : ''
    const labelText = `Liite ${pdfAtt.attachmentNum}${priceText}`
    const insertIndex = overviewPages + pdfPageOffset + pdfAtt.attachmentNum - 1

    // Insert all PDF pages
    for (let i = 0; i < pdfPages.length; i++) {
      pdfPages[i].drawText(labelText, {
        x: 40,
        y: pdfPages[i].getHeight() - 60,
        size: 18,
        font: helveticaFont
      })
      mainPdfDoc.insertPage(insertIndex + i, pdfPages[i])
    }
    // -1 since we need to take into account that one page is included in attachmentNum
    pdfPageOffset += pdfPages.length - 1
  }

  const finalPdfBytes = await mainPdfDoc.save()

  const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '_')
  const filenameDateStr = submissionDate.toLocaleDateString('fi-FI').replace(/\./g, '-')
  const filename = `${sanitizedName}-${filenameDateStr}-${entryId}.pdf`

  const data = await compress(Buffer.from(finalPdfBytes))

  return {
    filename,
    data
  }
}

export function formatISODate(isoDate: string) {
  const date = new Date(isoDate)
  return date.toLocaleDateString('fi-FI')
}

export function formatCurrency(amount: number) {
  return amount.toFixed(2).replace('.', ',')
}

export async function generatePartsFromEntry(entry: EntryWithItemsAndMileages) {
  const parts: PartData[] = []

  // Add items
  let attachmentNum = 1
  for (const item of entry.items) {
    const attachments: AttachmentData[] = []
    for (const att of item.attachments) {
      let data: Buffer = Buffer.alloc(0)
      if (att.fileId) {
        try {
          data = (await getFile(att.fileId)) || Buffer.alloc(0)
        } catch (e) {
          console.error('Error getting file:', e)
        }
      }
      const isPdfFile = isPdf(data)
      data = isPdfFile ? data : await convertToPng(data)
      attachments.push({
        ...att,
        data,
        mimeType: isPdfFile ? 'application/pdf' : 'image/png',
        attachmentNum: attachmentNum++
      })
    }
    const price = attachments.reduce((sum, att) => {
      if (!att.isNotReceipt && att.value) {
        return sum + att.value
      }
      return sum
    }, 0)
    parts.push({
      date: new Date(item.date),
      description: item.description,
      price,
      attachments
    })
  }

  // Add mileages
  for (const mileage of entry.mileages) {
    const mileageRate = env.NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE // Use environment variable
    parts.push({
      date: new Date(mileage.date),
      description: `Kilometrikorvaus: ${mileage.description}\nReitti: ${mileage.route}\nMatkan pituus: ${mileage.distance} km\nRekisterinumero: ${mileage.plateNo}`,
      price: mileage.distance * mileageRate,
      attachments: []
    })
  }

  return parts
}
