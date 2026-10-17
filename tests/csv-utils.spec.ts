import { BlobReader, TextWriter, ZipReader } from '@zip.js/zip.js'
import { expect, test } from '@playwright/test'

import { generateCsv } from '@/utils/csv-utils'

const submissionDate = new Date('2025-01-15T10:00:00Z')

function csvInfo(entryId: string, iban: string, pdfFilename: string) {
  return {
    entryId,
    name: 'Matti Meikäläinen',
    iban,
    govId: null,
    submissionDate,
    rows: [
      {
        unitPrice: 10,
        description: 'Receipt',
        quantity: 1,
        isMileage: false,
        bookkeepingAccount: null
      }
    ],
    pdf: { filename: pdfFilename, data: Buffer.from(`%PDF-1.4 ${entryId}`) }
  }
}

async function readZip(data: Buffer) {
  const reader = new ZipReader(new BlobReader(new Blob([new Uint8Array(data)])))
  const entries = await reader.getEntries()
  const csvEntry = entries.find((e) => e.filename.endsWith('.csv'))
  const csv = csvEntry && !csvEntry.directory ? await csvEntry.getData(new TextWriter()) : ''
  await reader.close()
  return { names: entries.map((e) => e.filename), csv }
}

test('zip export deduplicates colliding pdf filenames', async () => {
  // Same payee name and date but different IBANs, so the entries are not merged
  const { filename, data } = await generateCsv([
    csvInfo('entry-1', 'FI2112345600000785', 'Matti_Meik_l_inen-15-1-2025.pdf'),
    csvInfo('entry-2', 'FI5810171000000122', 'Matti_Meik_l_inen-15-1-2025.pdf'),
    csvInfo('entry-3', 'FI8847123400000017', 'matti_meik_l_inen-15-1-2025.PDF')
  ])

  expect(filename).toMatch(/\.zip$/)
  const { names, csv } = await readZip(data)

  const pdfNames = names.filter((n) => n.toLowerCase().endsWith('.pdf'))
  expect(pdfNames).toHaveLength(3)
  expect(new Set(pdfNames.map((n) => n.toLowerCase())).size).toBe(3)
  expect(pdfNames[0]).toBe('Matti_Meik_l_inen-15-1-2025.pdf')

  // Every CSV header row must point at a PDF that exists in the archive
  const referenced = csv
    .split('\n')
    .filter((line) => line.startsWith('K;'))
    .map((line) => line.split(';').at(-1))
  expect(referenced.toSorted()).toEqual(pdfNames.toSorted())
})
