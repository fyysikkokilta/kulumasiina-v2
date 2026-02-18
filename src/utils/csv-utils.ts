import { PDFDocument } from '@cantoo/pdf-lib'
import { ZipWriter, BlobWriter, BlobReader } from '@zip.js/zip.js'

import type { EntryWithItemsAndMileages } from '@/lib/db/schema'
import { env } from '@/lib/env'

interface CsvRow {
  unitPrice: number
  description: string
  quantity: number
  isMileage: boolean
  bookkeepingAccount: string | null
}

interface CsvInfo {
  entryId: string
  name: string
  iban: string
  govId: string | null
  submissionDate: Date
  rows: CsvRow[]
  pdf: { filename: string; data: Buffer } | null
}

export function isExpense(row: CsvRow) {
  return !row.isMileage
}

export function isMileage(row: CsvRow) {
  return row.isMileage
}

export function hasExpenses(rows: CsvRow[]) {
  return rows.some(isExpense)
}

export function hasMileages(rows: CsvRow[]) {
  return rows.some(isMileage)
}

export function substring80AndRemoveNewlines(str: string) {
  return str.substring(0, 80).replace(/\n/g, ' ')
}

export function removeAllWhitespace(str: string) {
  return str.replace(/\s/g, '')
}

export async function mergeCsvInfos(csvInfos: CsvInfo[]) {
  const mergedCsvInfos: CsvInfo[] = []

  for (const csvInfo of csvInfos) {
    let found = false
    for (const mergedCsvInfo of mergedCsvInfos) {
      const sameIban = removeAllWhitespace(mergedCsvInfo.iban) === removeAllWhitespace(csvInfo.iban)
      const sameGovId =
        removeAllWhitespace(mergedCsvInfo.govId || '') === removeAllWhitespace(csvInfo.govId || '')

      if (sameIban && sameGovId) {
        mergedCsvInfo.rows.push(...csvInfo.rows)

        // Merge PDFs
        if (csvInfo.pdf) {
          if (mergedCsvInfo.pdf) {
            const pdf1 = await PDFDocument.load(mergedCsvInfo.pdf.data)
            const pdf2 = await PDFDocument.load(csvInfo.pdf.data)

            const pdf2Pages = await pdf1.copyPages(pdf2, pdf2.getPageIndices())

            for (const page of pdf2Pages) {
              pdf1.addPage(page)
            }

            const pdfBytes = await pdf1.save()

            mergedCsvInfo.pdf = {
              filename: `${mergedCsvInfo.name}.pdf`,
              data: Buffer.from(pdfBytes)
            }
          } else {
            mergedCsvInfo.pdf = csvInfo.pdf
          }
        }
        mergedCsvInfo.submissionDate = new Date(
          Math.min(mergedCsvInfo.submissionDate.getTime(), csvInfo.submissionDate.getTime())
        )
        found = true
        break
      }
    }
    if (!found) {
      mergedCsvInfos.push({ ...csvInfo })
    }
  }

  return mergedCsvInfos
}

export async function generateCsv(csvInfos: CsvInfo[]) {
  const lines: string[] = []

  // Merge CSV infos with the same IBAN and HETU
  const mergedCsvInfos = await mergeCsvInfos(csvInfos)

  for (const csvInfo of mergedCsvInfos) {
    const { entryId, name, iban, govId, submissionDate, rows, pdf } = csvInfo

    const cleanIban = removeAllWhitespace(iban)
    const cleanGovId = removeAllWhitespace(govId || '')

    const pdfName = pdf?.filename || ''

    // Expenses
    if (hasExpenses(rows)) {
      const notes = !pdf ? `Muista lisätä PDFt liitetiedostoina: ${entryId}` : ''

      const expenseHeader = [
        'K', // Type
        'EUR', // Currency
        '', // Empty
        cleanIban, // IBAN
        '', // Empty for expenses (no HETU)
        'Tilisiirto', // Payment method
        name, // Name
        '', // Empty
        '0', // Zero
        't', // True
        't', // True
        '0', // Zero
        submissionDate.toLocaleDateString('fi-FI'), // Date
        '', // Empty
        submissionDate.toLocaleDateString('fi-FI'), // Date
        '',
        '',
        '',
        '', // Empty fields
        notes, // Notes
        '',
        '',
        '',
        '',
        '', // Empty fields
        '6', // Field 26
        '',
        '', // Empty fields
        't', // True
        '',
        '',
        '',
        '', // Empty fields
        pdfName // PDF filename
      ]

      lines.push(expenseHeader.join(';'))

      for (const row of rows.filter(isExpense)) {
        const expenseRow = [
          '', // Empty
          substring80AndRemoveNewlines(row.description), // Description
          '', // Product code
          row.quantity.toString(), // Quantity
          'kpl', // Unit
          row.unitPrice.toString(), // Unit price
          '0', // Discount
          '0', // VAT
          '', // Row comment
          '',
          '',
          '',
          '', // Empty fields
          row.bookkeepingAccount || '' // Bookkeeping account
        ]
        lines.push(expenseRow.join(';'))
      }
    }

    // Mileages
    if (hasMileages(rows)) {
      const notes = !pdf ? `Muista lisätä PDFt liitetiedostoina: ${entryId}` : ''

      const mileageHeader = [
        'T', // Type (travel)
        'EUR', // Currency
        '', // Empty
        cleanIban, // IBAN
        cleanGovId, // HETU for mileages
        'Tilisiirto', // Payment method
        name, // Name
        '', // Empty
        '0', // Zero
        't', // True
        't', // True
        '0', // Zero
        submissionDate.toLocaleDateString('fi-FI'), // Date
        '', // Empty
        submissionDate.toLocaleDateString('fi-FI'), // Date
        '',
        '',
        '',
        '', // Empty fields
        notes, // Notes
        '',
        '',
        '',
        '',
        '', // Empty fields
        '6', // Field 26
        '',
        '', // Empty fields
        't', // True
        '',
        '',
        '',
        '', // Empty fields
        pdfName // PDF filename
      ]

      lines.push(mileageHeader.join(';'))

      for (const row of rows.filter(isMileage)) {
        const mileageRow = [
          '', // Empty
          substring80AndRemoveNewlines(row.description), // Description
          env.MILEAGE_PROCOUNTOR_PRODUCT_ID, // Product code from environment variable
          row.quantity.toString(), // Quantity (km)
          'km', // Unit
          row.unitPrice.toString(), // Unit price
          '0', // Discount
          '0', // VAT
          '', // Row comment
          '',
          '',
          '',
          '', // Empty fields
          row.bookkeepingAccount || '' // Bookkeeping account
        ]
        lines.push(mileageRow.join(';'))
      }
    }
  }

  const csvContent = lines.join('\n')

  // Generate filename
  const dateStr =
    csvInfos[0]?.submissionDate.toISOString().split('T')[0] ||
    new Date().toISOString().split('T')[0]
  const documentName = `entry-data-${dateStr}`

  const csvInfoLength = csvInfos.length
  const hasPdf = mergedCsvInfos.some((info) => info.pdf)

  // If there is only one csv info and it doesn't have a pdf, return CSV as is
  if (!hasPdf && csvInfoLength === 1) {
    return {
      filename: `${documentName}.csv`,
      data: Buffer.from(csvContent, 'utf8')
    }
  }

  const multiName = `multi-entries-data-${dateStr}`

  // If merged csv infos don't have pdfs, return CSV as is
  if (!hasPdf) {
    return {
      filename: `${multiName}.csv`,
      data: Buffer.from(csvContent, 'utf8')
    }
  }

  // Create ZIP file with CSV and PDFs
  const archiveName = csvInfos.length === 1 ? documentName : multiName
  const zipData = await createZipArchive(
    csvContent,
    multiName,
    mergedCsvInfos.filter((info) => info.pdf)
  )

  return {
    filename: `${archiveName}.zip`,
    data: zipData
  }
}

async function createZipArchive(csvContent: string, csvFilename: string, pdfInfos: CsvInfo[]) {
  // Create a BlobWriter to collect ZIP data
  const blobWriter = new BlobWriter()
  const zipWriter = new ZipWriter(blobWriter)

  // Add CSV file
  await zipWriter.add(
    `${csvFilename}.csv`,
    new BlobReader(new Blob([Buffer.from(csvContent, 'utf8')]))
  )

  // Add PDF files
  for (const pdfInfo of pdfInfos) {
    if (pdfInfo.pdf) {
      await zipWriter.add(
        pdfInfo.pdf.filename,
        new BlobReader(new Blob([Buffer.from(pdfInfo.pdf.data)]))
      )
    }
  }

  // Finalize zip
  const zipBlob = await zipWriter.close()

  // Convert Blob -> Buffer
  const arrayBuffer = await zipBlob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export function generateCsvInfoFromEntry(
  entry: EntryWithItemsAndMileages,
  pdf?: { filename: string; data: Buffer }
) {
  const rows: CsvRow[] = []

  // Add items
  for (const item of entry.items) {
    const totalValue = item.attachments.reduce((sum, att) => {
      if (att.value && !att.isNotReceipt) {
        return sum + att.value
      }
      return sum
    }, 0)

    rows.push({
      unitPrice: totalValue,
      description: item.description,
      quantity: 1,
      isMileage: false,
      bookkeepingAccount: item.account
    })
  }

  // Add mileages
  for (const mileage of entry.mileages) {
    rows.push({
      unitPrice: env.NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE, // Use environment variable
      description: `Kilometrikorvaus: ${mileage.description}`,
      quantity: mileage.distance,
      isMileage: true,
      bookkeepingAccount: mileage.account
    })
  }

  return {
    entryId: entry.id,
    name: entry.name,
    iban: entry.iban,
    govId: entry.govId,
    submissionDate: new Date(entry.submissionDate),
    rows,
    pdf: pdf || null
  }
}
