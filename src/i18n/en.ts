const en = {
  metadata: {
    title: 'FK-Expenses',
    description: 'Guild of Physics Expense Management System'
  },
  ExpenseForm: {
    title: 'FK-Expenses',
    submit: 'Submit',
    payee_name: 'Payee Name',
    payee_name_placeholder: 'Carl Compensator',
    payee_contact: 'Contact Information',
    payee_contact_placeholder: 'Telegram / Email / Phone',
    iban: 'IBAN',
    iban_placeholder: 'FI12 3456 7890 1234 56',
    claim_title: 'Claim Title',
    claim_title_placeholder: '(event) items and mileages',
    personal_id_code: 'Personal ID Code',
    personal_id_code_placeholder: '123456-789A',
    add_expense: 'Expense',
    add_mileage: 'Mileage',
    max_items_reached: 'Maximum 20 items reached',
    max_mileages_reached: 'Maximum 20 mileage entries reached',
    entries_count:
      '{items}/{maxItems} items, {mileages}/{maxMileages} mileage entries',
    total: 'Total',
    edit: 'Edit',
    remove: 'Remove',
    entries: 'Entries',
    expense_item: 'Expense item',
    mileage: 'Mileage',
    attachments: '{attachments, plural, =1 {attachment} other {attachments}}',
    route: 'Route',
    plate_number: 'Plate Number',
    success: {
      title: 'Success!',
      sub_title: 'Your expense claim has been submitted successfully.',
      send_another: 'Submit Another'
    },
    failure: {
      title: 'Error!',
      sub_title: 'Failed to submit expense claim. Please try again.',
      try_again: 'Try Again'
    },
    privacy_policy:
      'By submitting this form, you agree to <privacy_policy>the privacy policy</privacy_policy>.',
    errors: {
      payee_name: 'Please enter payee name!',
      payee_contact: 'Please enter contact information!',
      iban_required: 'Please enter IBAN!',
      iban_invalid: 'Invalid IBAN format!',
      claim_title: 'Please enter claim title!',
      personal_id_code_required:
        'Government issued personal identification code is required for paying mileages!',
      personal_id_code_invalid:
        'Invalid Finnish social security number format!',
      no_entries: 'Please add at least one expense or mileage entry!'
    }
  },
  EntryCommonFields: {
    description: 'Description',
    description_placeholder: 'Description of the entry',
    date: 'Date',
    select_date: 'Select date',
    account: 'Bookkeeping Account',
    select: 'Select...',
    account_placeholder:
      "Leave this blank if you don't know the correct account."
  },
  ItemForm: {
    add: 'Add an expense',
    edit: 'Edit expense',
    attachments: 'Attachments',
    attachments_help: 'Images and PDF (max 20, 8 MB each).',
    attachment_file: 'File',
    preview_file: 'Preview',
    attachment_value: 'Amount',
    remove_attachment: 'Remove attachment',
    upload: 'Upload',
    value_placeholder: '0.00',
    value_unit: '€',
    is_not_receipt: 'Extra attachment',
    upload_note: 'Most common image file types and PDF files are supported.',
    close: 'Close',
    cancel: 'Cancel',
    ok: 'OK',
    errors: {
      description: 'Please provide a description!',
      date: 'Please provide a date for the expense!',
      account_invalid: 'Account must be 0-4 digits',
      value_min: 'Value must be greater than 0.01',
      value_max: 'Value must be less than 1,000,000',
      attachments_min: 'Please add at least one attachment!',
      attachments_max: 'Maximum 20 attachments per item',
      at_least_one_value: 'At least one attachment must have a monetary value!',
      upload_failed: 'Upload failed. Please try again.',
      file_too_large: 'File must be at most 8 MB.'
    }
  },
  MileageForm: {
    add: 'Add a mileage',
    edit: 'Edit mileage',
    route: 'Route',
    route_placeholder: 'Guild room - venue (address) - Guild room',
    distance: 'Distance',
    distance_placeholder: '0',
    distance_unit: 'km',
    plate_number: 'Plate Number',
    plate_number_placeholder: 'ABC-123',
    close: 'Close',
    cancel: 'Cancel',
    ok: 'OK',
    errors: {
      description: 'Please provide a description!',
      date: 'Please provide a date for the mileage!',
      route: 'Please provide the used route!',
      distance_required: 'Please provide the distance driven!',
      distance_invalid: 'Please provide a valid positive number!',
      plate_number: 'Please provide the plate number of the vehicle!',
      plate_number_invalid: 'Invalid plate number format',
      account_invalid: 'Account must be 0-4 digits'
    }
  },
  FormResult: {
    success: {
      title: 'Success!',
      sub_title: 'Your expense claim has been submitted successfully.',
      send_another: 'Submit Another'
    },
    failure: {
      title: 'Error!',
      sub_title: 'Failed to submit expense claim. Please try again.',
      try_again: 'Try Again'
    }
  },
  Login: {
    title: 'Login Required',
    description: 'Please log in to access the expense management system.',
    login_google: 'Login with Google',
    cancel: 'Cancel',
    login: 'Login',
    logout: 'Logout',
    loading: 'Loading...'
  },
  LanguageSwitcher: {
    other_language: 'FI'
  },
  AdminEntryTable: {
    table: {
      archived: 'Archived',
      id: 'ID',
      date: 'Date',
      description: 'Description',
      name: 'Name',
      title: 'Title',
      total: 'Total',
      status: 'Status',
      actions: 'Actions',
      contact: 'Contact',
      iban: 'IBAN',
      items: 'Items',
      mileages: 'Mileages',
      select_account: 'Select account',
      attachments: 'Attachments',
      not_receipt: 'Extra attachment',
      route: 'Route',
      plate_number: 'Plate Number',
      select: 'Select...'
    },
    table_pagination: {
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
      no_data_available: 'No data available',
      select: 'Select...',
      per_page: '/ page'
    },
    status: {
      submitted: 'SUBMITTED',
      approved: 'APPROVED',
      paid: 'PAID',
      denied: 'DENIED',
      archived: 'ARCHIVED',
      active: 'ACTIVE'
    },
    filter: {
      all_statuses: 'All statuses',
      all: 'All',
      active: 'Active',
      archived: 'Archived',
      submitted: 'Submitted',
      approved: 'Approved',
      paid: 'Paid',
      denied: 'Denied',
      filter: 'Filter',
      reset: 'Reset',
      ok: 'OK',
      name_placeholder: 'Filter by name',
      title_placeholder: 'Filter by title',
      total_placeholder: 'Min sum',
      date_placeholder: 'From date',
      start_date: 'Start date',
      end_date: 'End date',
      search_in_filters: 'Search in filters',
      no_names_found: 'Name not found'
    },
    actions: {
      pdf: 'PDF',
      csv: 'CSV',
      zip: 'ZIP',
      edit: 'Edit',
      approve: 'Approve',
      deny: 'Deny',
      pay: 'Pay',
      reset: 'Reset',
      archive: 'Archive'
    },
    selection: {
      entries_selected:
        '{entries, plural, =1 {entry} other {entries}} selected',
      status: 'Status',
      mixed_statuses: 'Mixed statuses - some actions may be unavailable'
    },
    bulk_actions: {
      approve_selected: 'Approve Selected',
      deny_selected: 'Deny Selected',
      mark_as_paid: 'Mark as Paid',
      reset_selected: 'Reset Selected',
      archive_selected: 'Archive Selected',
      download_zip: 'Download ZIP',
      remove_old_archived: 'Remove Old Archived Entries ({count})',
      copy_clipboard_text: 'Copy to clipboard'
    }
  },
  AdminEntryExpandedRow: {
    select: 'Select...'
  },
  ApproveModal: {
    title: 'Approve Entries',
    date: 'Approval Date',
    date_error: 'Please select approval date',
    approval_note: 'Approval Note',
    approval_note_error: 'Please enter approval note',
    approval_note_placeholder: 'Board meeting xx/yy',
    submit: 'Approve',
    cancel: 'Cancel',
    close: 'Close'
  },
  PayModal: {
    title: 'Mark as Paid',
    date: 'Payment Date',
    date_error: 'Please select payment date',
    submit: 'Mark as Paid',
    cancel: 'Cancel',
    close: 'Close'
  },
  DeleteOldArchivedModal: {
    title: 'Remove old archived entries',
    text_1:
      'Are you sure you want to remove old archived entries? This action cannot be undone.',
    text_2:
      'Make sure that for each paid entry the pdf has been archived to Procountor.',
    remove: 'Remove',
    cancel: 'Cancel',
    close: 'Close'
  },
  PreviewModal: {
    close: 'Close',
    is_not_receipt: 'Extra attachment',
    loading: 'Loading…'
  }
} as const

export default en
