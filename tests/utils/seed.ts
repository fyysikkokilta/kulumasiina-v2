import fs from 'fs/promises'
import path from 'path'

import { db } from '@/lib/db'
import { attachments, entries, items } from '@/lib/db/schema'

import { testAttachmentIds, testEntryIds, testItemIds } from './test-data'

export async function seedTestData() {
  await db.delete(attachments)
  await db.delete(items)
  await db.delete(entries)

  await db.insert(entries).values([
    {
      id: testEntryIds.submitted,
      name: 'Test Submitted',
      contact: 'submitted@example.com',
      iban: 'FI2112345600000785',
      title: 'Submitted entry',
      status: 'submitted',
      submissionDate: new Date('2025-01-05T10:00:00.000Z'),
      archived: false
    },
    {
      id: testEntryIds.submittedSecond,
      name: 'Test Submitted Two',
      contact: 'submitted2@example.com',
      iban: 'FI2112345600000785',
      title: 'Submitted entry 2',
      status: 'submitted',
      submissionDate: new Date('2025-01-05T11:00:00.000Z'),
      archived: false
    },
    {
      id: testEntryIds.approved,
      name: 'Test Approved',
      contact: 'approved@example.com',
      iban: 'FI2112345600000785',
      title: 'Approved entry',
      status: 'approved',
      submissionDate: new Date('2025-01-04T10:00:00.000Z'),
      approvalDate: new Date('2025-01-06T10:00:00.000Z'),
      approvalNote: 'Seed approval',
      archived: false
    },
    {
      id: testEntryIds.paid,
      name: 'Test Paid',
      contact: 'paid@example.com',
      iban: 'FI2112345600000785',
      title: 'Paid entry',
      status: 'paid',
      submissionDate: new Date('2025-01-03T10:00:00.000Z'),
      approvalDate: new Date('2025-01-06T10:00:00.000Z'),
      approvalNote: 'Seed approval',
      paidDate: new Date('2025-01-07T10:00:00.000Z'),
      archived: false
    },
    {
      id: testEntryIds.denied,
      name: 'Test Denied',
      contact: 'denied@example.com',
      iban: 'FI2112345600000785',
      title: 'Denied entry',
      status: 'denied',
      submissionDate: new Date('2025-01-02T10:00:00.000Z'),
      rejectionDate: new Date('2025-01-06T10:00:00.000Z'),
      archived: false
    }
  ])

  await db.insert(items).values([
    {
      id: testItemIds.submitted,
      entryId: testEntryIds.submitted,
      description: 'Submitted item',
      date: new Date('2025-01-01T10:00:00.000Z'),
      account: null
    },
    {
      id: testItemIds.submittedSecond,
      entryId: testEntryIds.submittedSecond,
      description: 'Submitted item 2',
      date: new Date('2025-01-01T11:00:00.000Z'),
      account: null
    },
    {
      id: testItemIds.approved,
      entryId: testEntryIds.approved,
      description: 'Approved item',
      date: new Date('2025-01-01T10:00:00.000Z'),
      account: null
    },
    {
      id: testItemIds.paid,
      entryId: testEntryIds.paid,
      description: 'Paid item',
      date: new Date('2025-01-01T10:00:00.000Z'),
      account: null
    },
    {
      id: testItemIds.denied,
      entryId: testEntryIds.denied,
      description: 'Denied item',
      date: new Date('2025-01-01T10:00:00.000Z'),
      account: null
    }
  ])

  await db.insert(attachments).values([
    {
      id: testAttachmentIds.submitted,
      itemId: testItemIds.submitted,
      fileId: testAttachmentIds.submitted,
      filename: 'submitted-receipt.png',
      value: 10,
      isNotReceipt: false
    },
    {
      id: testAttachmentIds.submittedSecond,
      itemId: testItemIds.submittedSecond,
      fileId: testAttachmentIds.submittedSecond,
      filename: 'submitted-receipt-2.png',
      value: 15,
      isNotReceipt: false
    },
    {
      id: testAttachmentIds.approved,
      itemId: testItemIds.approved,
      fileId: testAttachmentIds.approved,
      filename: 'approved-receipt.png',
      value: 20,
      isNotReceipt: false
    },
    {
      id: testAttachmentIds.paid,
      itemId: testItemIds.paid,
      fileId: testAttachmentIds.paid,
      filename: 'paid-receipt.png',
      value: 30,
      isNotReceipt: false
    },
    {
      id: testAttachmentIds.denied,
      itemId: testItemIds.denied,
      fileId: testAttachmentIds.denied,
      filename: 'denied-receipt.png',
      value: 40,
      isNotReceipt: false
    }
  ])

  const dataDir = path.join(process.cwd(), 'data')
  await fs.mkdir(dataDir, { recursive: true })

  const samplePdfBase64 =
    'JVBERi0xLjUKJeLjz9MKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFsgMyAwIFIgXSAvQ291bnQgMSA+PgplbmRvYmoKMyAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbMCAwIDIwMCAyMDBdIC9Db250ZW50cyA0IDAgUiA+PgplbmRvYmoKNCAwIG9iago8PCAvTGVuZ3RoIDQ0ID4+CnN0cmVhbQpCVAovRjEgMTIgVGYKMTAwIDEwMCBUZAooVGVzdCByZWNlaXB0KSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA4MCAwMDAwMCBuIAowMDAwMDAwMTUyIDAwMDAwIG4gCjAwMDAwMDAyNTkgMDAwMDAgbiAKMDAwMDAwMDM0NiAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjQ1NQolJUVPRgo='
  const samplePdf = Buffer.from(samplePdfBase64, 'base64')
  const fileIds = Object.values(testAttachmentIds)

  await Promise.all(
    fileIds.map((fileId) => fs.writeFile(path.join(dataDir, fileId), samplePdf))
  )
}
