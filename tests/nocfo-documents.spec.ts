import { expect, test } from '@playwright/test'

import type { EntryWithItemsAndMileages } from '@/db/types'
import {
  buildDocumentPayload,
  classifyExistingDocuments,
  documentLines,
  documentMarker,
  entriesMissingAccounts,
  groupByPayee,
  markerEntryIds,
  toCents,
  TooManyEntriesError
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
  nocfoDocumentId: null,
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
    bankAccountId: 99,
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

const accountIds = new Map([
  ['4205', 11],
  ['4300', 12]
])

test('buildDocumentPayload limits line descriptions to 256 chars', { tag: '@node' }, () => {
  const long = {
    ...entry,
    items: [{ ...entry.items[0], description: 'x'.repeat(1000) }],
    mileages: [{ ...entry.mileages[0], description: 'y'.repeat(1000) }]
  }
  const payload = buildDocumentPayload({
    entries: [long],
    paidDate: date,
    accountIds,
    bankAccountId: 99,
    attachmentIds: []
  })
  for (const e of payload.blueprint.debet_entries) {
    expect(e.description.length).toBeLessThanOrEqual(256)
  }
})

const manyEntries = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    ...entry,
    id: `${String(i).padStart(8, '0')}-0000-0000-0000-000000000000`,
    name: `Person ${i} ${'n'.repeat(40)}`,
    title: `Title ${i} ${'t'.repeat(40)}`
  }))

const payloadFor = (entries: EntryWithItemsAndMileages[]) =>
  buildDocumentPayload({
    entries,
    paidDate: date,
    accountIds,
    bankAccountId: 99,
    attachmentIds: []
  })

test('buildDocumentPayload caps the description at 256 chars', { tag: '@node' }, () => {
  const long = { ...entry, name: 'n'.repeat(500), title: 't'.repeat(500) }
  const payload = payloadFor([long])
  expect(payload.description.length).toBeLessThanOrEqual(256)
  expect(payload.description).toMatch(/^Kulukorvaus: n+/)
  expect(payload.description.endsWith(` ${documentMarker([long.id])}`)).toBe(true)
  expect(payload.blueprint.credit_entries[0].description).toBe(payload.description)
})

test('buildDocumentPayload keeps the full marker for large groups', { tag: '@node' }, () => {
  const entries = manyEntries(26)
  const payload = payloadFor(entries)
  expect(payload.description.length).toBeLessThanOrEqual(256)
  expect(payload.description).toMatch(/^Kulukorvaus/)
  expect(payload.description).toContain(documentMarker(entries.map((e) => e.id)))
})

test('buildDocumentPayload rejects groups whose marker cannot fit', { tag: '@node' }, () => {
  expect(() => payloadFor(manyEntries(27))).toThrow(TooManyEntriesError)
})

test('documentLines puts the rounding residual on the last line', { tag: '@node' }, () => {
  const mileage = { ...entry.mileages[0], distance: 12.3 }
  const trips = {
    ...entry,
    items: [],
    mileages: [mileage, { ...mileage, id: 'm2' }, { ...mileage, id: 'm3' }]
  }
  const total = documentLines(trips).reduce((sum, line) => sum + line.amountCents, 0)
  expect(total).toBe(923)
  expect(payloadFor([trips]).blueprint.credit_entries[0].amount).toBe(923)
})

test('empty account strings count as missing', { tag: '@node' }, () => {
  const blank = {
    ...entry,
    id: 'cccccccc-0000-0000-0000-000000000003',
    items: [{ ...entry.items[0], account: '' }]
  }
  expect(entriesMissingAccounts([entry, blank])).toEqual([blank.id])
  expect(documentLines(blank)[0].accountNumber).toBeNull()
})

test('markerEntryIds parses every marker in a description', { tag: '@node' }, () => {
  expect(markerEntryIds('Kulukorvaus: x [KM:aaaaaaaa,bbbbbbbb] [KM:cccccccc]')).toEqual([
    ['aaaaaaaa', 'bbbbbbbb'],
    ['cccccccc']
  ])
  expect(markerEntryIds('no marker here')).toEqual([])
})

test('classifyExistingDocuments links exact sets and flags overlaps', { tag: '@node' }, () => {
  const ids = ['aaaaaaaa-1', 'bbbbbbbb-2']
  expect(classifyExistingDocuments(ids, [])).toEqual({ kind: 'none' })
  expect(classifyExistingDocuments(ids, [{ id: 7, entryIds: ['bbbbbbbb', 'aaaaaaaa'] }])).toEqual({
    kind: 'match',
    documentId: 7
  })
  expect(classifyExistingDocuments(ids, [{ id: 8, entryIds: ['aaaaaaaa'] }])).toEqual({
    kind: 'conflict',
    documentId: 8
  })
  expect(
    classifyExistingDocuments(ids, [{ id: 9, entryIds: ['aaaaaaaa', 'bbbbbbbb', 'cccccccc'] }])
  ).toEqual({ kind: 'conflict', documentId: 9 })
})

test('buildDocumentPayload throws on unknown account', { tag: '@node' }, () => {
  expect(() =>
    buildDocumentPayload({
      entries: [entry],
      paidDate: date,
      accountIds: new Map(),
      bankAccountId: 99,
      attachmentIds: []
    })
  ).toThrow()
})
