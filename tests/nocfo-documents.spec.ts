import { expect, test } from '@playwright/test'

import type { EntryWithItemsAndMileages } from '@/db/types'
import {
  buildDocumentPayload,
  documentLines,
  documentMarker,
  entriesMissingAccounts,
  groupByPayee,
  toCents
} from '@/lib/nocfo-documents'

const date = new Date('2026-10-01T00:00:00Z')

const entry: EntryWithItemsAndMileages = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  name: 'Matti Meikäläinen',
  contact: 'matti@example.com',
  iban: 'FI2112345600000785',
  govId: null,
  title: 'Excursion',
  status: 'approved',
  submissionDate: date,
  approvalDate: date,
  approvalNote: null,
  paidDate: null,
  rejectionDate: null,
  archived: false,
  items: [
    {
      id: 'i1',
      description: 'item1',
      date,
      account: '4205',
      entryId: 'aaaaaaaa-0000-0000-0000-000000000001',
      attachments: [
        {
          id: 'a1',
          filename: 'a.pdf',
          value: 10,
          isNotReceipt: false,
          fileId: 'f1',
          itemId: 'i1'
        },
        {
          id: 'a2',
          filename: 'b.pdf',
          value: 99,
          isNotReceipt: true,
          fileId: 'f2',
          itemId: 'i1'
        }
      ]
    },
    {
      id: 'i2',
      description: 'item2',
      date,
      account: '4205',
      entryId: 'aaaaaaaa-0000-0000-0000-000000000001',
      attachments: [
        {
          id: 'a3',
          filename: 'c.pdf',
          value: null,
          isNotReceipt: false,
          fileId: 'f3',
          itemId: 'i2'
        }
      ]
    }
  ],
  mileages: [
    {
      id: 'm1',
      description: 'trip',
      date,
      route: 'A-B',
      distance: 100,
      plateNo: 'ABC-123',
      account: '4300',
      entryId: 'aaaaaaaa-0000-0000-0000-000000000001'
    }
  ]
}

const entryWithAccounts = entry
const entryMissingMileageAccount: EntryWithItemsAndMileages = {
  ...entry,
  id: 'bbbbbbbb-0000-0000-0000-000000000002',
  mileages: [{ ...entry.mileages[0], account: null }]
}

test('toCents rounds float euros', { tag: '@node' }, () => {
  expect(toCents(10.1 + 0.2)).toBe(1030)
  expect(toCents(123.4 * 0.25)).toBe(3085)
})

test(
  'groupByPayee ignores whitespace and case, treats null and empty govId alike',
  { tag: '@node' },
  () => {
    const a = { id: 'a', iban: 'FI21 1234 5600 0007 85', govId: null }
    const b = { id: 'b', iban: 'fi2112345600000785', govId: '' }
    const c = { id: 'c', iban: 'FI2112345600000785', govId: '010101-123N' }
    expect(groupByPayee([a, b, c]).map((g) => g.map((e) => e.id))).toEqual([['a', 'b'], ['c']])
  }
)

test(
  'documentLines sums receipt values, skips non-receipts and zero lines',
  { tag: '@node' },
  () => {
    expect(documentLines(entry)).toEqual([
      { accountNumber: '4205', description: 'item1', amountCents: 1000 },
      { accountNumber: '4300', description: 'Kilometrikorvaus: trip', amountCents: 2500 }
    ])
  }
)

test('entriesMissingAccounts lists entries with any null account', { tag: '@node' }, () => {
  expect(entriesMissingAccounts([entryWithAccounts, entryMissingMileageAccount])).toEqual([
    entryMissingMileageAccount.id
  ])
})

test('documentMarker is order independent', { tag: '@node' }, () => {
  expect(documentMarker(['bbbbbbbb-1', 'aaaaaaaa-2'])).toBe('[KM:aaaaaaaa,bbbbbbbb]')
  expect(documentMarker(['aaaaaaaa-2', 'bbbbbbbb-1'])).toBe('[KM:aaaaaaaa,bbbbbbbb]')
})

test('buildDocumentPayload balances and embeds the marker', { tag: '@node' }, () => {
  const payload = buildDocumentPayload({
    entries: [entry],
    paidDate: new Date('2026-10-17T00:00:00Z'),
    accountIds: new Map([
      ['4205', 11],
      ['4300', 12]
    ]),
    payableAccountId: 99,
    attachmentIds: [501]
  })
  expect(payload.date).toBe('2026-10-17')
  expect(payload.is_draft).toBe(false)
  expect(payload.attachment_ids).toEqual([501])
  expect(payload.description).toContain(documentMarker([entry.id]))
  expect(payload.blueprint.debet_entries.map((e) => [e.account_id, e.amount])).toEqual([
    [11, 1000],
    [12, 2500]
  ])
  expect(payload.blueprint.credit_entries).toEqual([
    { account_id: 99, description: expect.any(String), amount: 3500, vat_rate: 0 }
  ])
})

test('buildDocumentPayload keeps the marker when truncating', { tag: '@node' }, () => {
  const long = { ...entry, title: 'x'.repeat(1000) }
  const payload = buildDocumentPayload({
    entries: [long],
    paidDate: date,
    accountIds: new Map([
      ['4205', 11],
      ['4300', 12]
    ]),
    payableAccountId: 99,
    attachmentIds: []
  })
  expect(payload.description.endsWith(documentMarker([long.id]))).toBe(true)
  expect(payload.description.length).toBeLessThanOrEqual(255)
})

test('buildDocumentPayload throws on unknown account', { tag: '@node' }, () => {
  expect(() =>
    buildDocumentPayload({
      entries: [entry],
      paidDate: date,
      accountIds: new Map(),
      payableAccountId: 99,
      attachmentIds: []
    })
  ).toThrow()
})
