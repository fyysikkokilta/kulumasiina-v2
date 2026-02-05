/**
 * Validates Finnish social security number (henkilötunnus)
 * Format: DDMMYY-NNNC or DDMMYY+NNNC or DDMMYYANNC
 * Where:
 * - DD = day (01-31)
 * - MM = month (01-12)
 * - YY = year (last two digits)
 * - Century marker: - (1900s), + (1800s), A (2000s)
 * - NNN = individual number (001-899)
 * - C = check character
 */
export function validateFinnishSSN(ssn: string) {
  if (!ssn || typeof ssn !== 'string') {
    return false
  }

  // Remove spaces and convert to uppercase
  const cleanSSN = ssn.replace(/\s/g, '').toUpperCase()

  // Check format: 6 digits + century marker + 3 digits + check character
  const pattern = /^(\d{2})(\d{2})(\d{2})([-+A])(\d{3})([0-9A-Y])$/
  const match = cleanSSN.match(pattern)

  if (!match) {
    return false
  }

  const [, day, month, year, centuryMarker, individualNumber, checkChar] = match

  // Validate date parts
  const dayNum = parseInt(day, 10)
  const monthNum = parseInt(month, 10)
  const yearNum = parseInt(year, 10)

  if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
    return false
  }

  // Determine full year based on century marker
  let fullYear: number
  switch (centuryMarker) {
    case '+':
      fullYear = 1800 + yearNum
      break
    case '-':
      fullYear = 1900 + yearNum
      break
    case 'A':
      fullYear = 2000 + yearNum
      break
    default:
      return false
  }

  // Validate the date exists (basic check)
  const date = new Date(fullYear, monthNum - 1, dayNum)
  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== monthNum - 1 ||
    date.getDate() !== dayNum
  ) {
    return false
  }

  // Validate individual number (001-899 for permanent residents)
  const individualNum = parseInt(individualNumber, 10)
  if (individualNum < 1 || individualNum > 899) {
    return false
  }

  // Validate check character
  const checkString = day + month + year + individualNumber
  const checkNum = parseInt(checkString, 10)
  const remainder = checkNum % 31

  const checkChars = '0123456789ABCDEFHJKLMNPRSTUVWXY'
  const expectedCheckChar = checkChars[remainder]

  return checkChar === expectedCheckChar
}

/**
 * Formats Finnish SSN for display (adds spaces for readability)
 */
export function formatFinnishSSN(ssn: string) {
  if (!ssn) return ssn

  const cleanSSN = ssn.replace(/\s/g, '').toUpperCase()
  const pattern = /^(\d{6})([-+A])(\d{3})([0-9A-Y])$/
  const match = cleanSSN.match(pattern)

  if (match) {
    const [, datePart, centuryMarker, individualNumber, checkChar] = match
    return `${datePart}${centuryMarker}${individualNumber}${checkChar}`
  }

  return ssn
}

// PDF magic bytes
const PDF_MAGIC_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46]) // %PDF

/**
 * Detect if file is PDF based on magic bytes
 */
export function isPdf(data: Buffer) {
  return data.length >= 4 && data.subarray(0, 4).equals(PDF_MAGIC_BYTES)
}
