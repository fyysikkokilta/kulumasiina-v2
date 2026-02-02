const fi = {
  metadata: {
    title: 'FK-Kulut',
    description: 'Fyysikkokillan kulukorvausjärjestelmä'
  },
  ExpenseForm: {
    title: 'FK-Kulut',
    submit: 'Lähetä',
    payee_name: 'Maksun saajan nimi',
    payee_name_placeholder: 'Kullervo Kularoija',
    payee_contact: 'Yhteystiedot',
    payee_contact_placeholder: 'Telegram / Sähköposti / Puhelinnumero',
    iban: 'IBAN',
    iban_placeholder: 'FI12 3456 7890 1234 56',
    claim_title: 'Kulukorvauksen otsikko',
    claim_title_placeholder: '(tapahtuma) kulut ja matkat',
    personal_id_code: 'Henkilötunnus',
    personal_id_code_placeholder: '123456-789A',
    add_expense: 'Kulu',
    add_mileage: 'Matka',
    max_items_reached: 'Maksimimäärä kuluja saavutettu',
    max_mileages_reached: 'Maksimimäärä matkoja saavutettu',
    entries_count: '{items}/{maxItems} kulua, {mileages}/{maxMileages} matkaa',
    total: 'Summa',
    edit: 'Muokkaa',
    remove: 'Poista',
    entries: 'Kirjaukset',
    expense_item: 'Kulu',
    mileage: 'Matka',
    attachments: '{attachments, plural, =1 {tosite} other {tositetta}}',
    route: 'Reitti',
    plate_number: 'Rekisterinumero',
    success: {
      title: 'Onnistui!',
      sub_title: 'Kulukorvaushakemus on lähetetty onnistuneesti.',
      send_another: 'Lähetä toinen'
    },
    failure: {
      title: 'Virhe!',
      sub_title:
        'Kulukorvaushakemuksen lähettäminen epäonnistui. Yritä uudelleen.',
      try_again: 'Yritä uudelleen'
    },
    privacy_policy:
      'Lähettämällä tämän lomakkeen hyväksyt <privacy_policy>tietosuojaselosteen</privacy_policy>.',
    errors: {
      payee_name: 'Syötä maksun saajan nimi!',
      payee_contact: 'Syötä yhteystiedot!',
      iban_required: 'Syötä IBAN!',
      iban_invalid: 'Virheellinen IBAN-muoto!',
      claim_title: 'Syötä kulukorvauksen otsikko!',
      personal_id_code_required:
        'Henkilötunnus tarvitaan matkakorvauksien maksamista varten!',
      personal_id_code_invalid: 'Virheellinen henkilötunnus!',
      no_entries: 'Lisää vähintään yksi kulu tai matka!'
    }
  },
  ItemForm: {
    add: 'Lisää kulu',
    edit: 'Muokkaa kulua',
    description: 'Kuvaus',
    description_placeholder: 'Kuvaus kulusta',
    date: 'Päivämäärä',
    select_date: 'Valitse päivämäärä',
    attachments: 'Tositteet',
    attachments_help: 'Kuvat ja PDF (max 20 kpl, 8 MB / tiedosto).',
    attachment_file: 'Tiedosto',
    preview_file: 'Esikatsele',
    attachment_value: 'Summa',
    remove_attachment: 'Poista tosite',
    upload: 'Lisää tosite',
    value_placeholder: '0.00',
    value_unit: '€',
    is_not_receipt: 'Lisäliite',
    account: 'Kirjanpito-tili',
    account_placeholder:
      'Voit jättää tämän tyhjäksi, jos et tiedä oikeaa tiliä.',
    upload_note:
      'Yleisimmät kuvatiedostotyypit ja PDF-tiedostot ovat tuettuja.',
    close: 'Sulje',
    cancel: 'Peruuta',
    ok: 'OK',
    select: 'Valitse...',
    errors: {
      description: 'Anna kuvaus!',
      date: 'Anna päivämäärä!',
      account_invalid: 'Tilin on oltava 0–4 numeroa',
      value_min: 'Summan on oltava suurempi kuin 0.01',
      value_max: 'Summan on oltava pienempi kuin 1,000,000',
      attachments_min: 'Lisää vähintään yksi tosite!',
      attachments_max: 'Enintään 20 tositetta per kulu',
      at_least_one_value:
        'Vähintään yhdellä tositteella tulee olla rahallinen arvo!',
      upload_failed: 'Tiedoston lataus epäonnistui. Yritä uudelleen.'
    }
  },
  MileageForm: {
    add: 'Lisää matka',
    edit: 'Muokkaa matkaa',
    description: 'Kuvaus',
    description_placeholder: 'Kuvaus matkasta',
    date: 'Päivämäärä',
    select_date: 'Valitse päivämäärä',
    route: 'Reitti',
    route_placeholder: 'kiltahuone -> kohde (osoite) -> kiltahuone',
    distance: 'Matkan pituus',
    distance_placeholder: '0',
    distance_unit: 'km',
    plate_number: 'Rekisterinumero',
    plate_number_placeholder: 'ABC-123',
    account: 'Kirjanpito-tili',
    account_placeholder:
      'Voit jättää tämän tyhjäksi, jos et tiedä oikeaa tiliä.',
    close: 'Sulje',
    cancel: 'Peruuta',
    ok: 'OK',
    select: 'Valitse...',
    errors: {
      description: 'Anna kuvaus!',
      date: 'Anna päivämäärä!',
      route: 'Anna käytetty reitti!',
      distance_required: 'Anna matkan pituus!',
      distance_invalid: 'Anna positiivinen matkan pituus!',
      plate_number: 'Anna autosi rekisterinumero!',
      plate_number_invalid: 'Virheellinen rekisterinumeron muoto',
      account_invalid: 'Tilin on oltava 0–4 numeroa'
    }
  },
  FormResult: {
    success: {
      title: 'Onnistui!',
      sub_title: 'Kulukorvaushakemus on lähetetty onnistuneesti.',
      send_another: 'Lähetä toinen'
    },
    failure: {
      title: 'Virhe!',
      sub_title:
        'Kulukorvaushakemuksen lähettäminen epäonnistui. Yritä uudelleen.',
      try_again: 'Yritä uudelleen'
    }
  },
  Login: {
    title: 'Kirjautuminen vaaditaan',
    description: 'Kirjaudu sisään käyttääksesi kulumasiinaa.',
    login_google: 'Kirjaudu Google-tilillä',
    cancel: 'Peruuta',
    login: 'Kirjaudu',
    logout: 'Kirjaudu ulos',
    loading: 'Ladataan...'
  },
  LanguageSwitcher: {
    other_language: 'EN'
  },
  AdminEntryTable: {
    table: {
      archived: 'Arkistoitu',
      id: 'ID',
      date: 'Päivämäärä',
      description: 'Kuvaus',
      name: 'Nimi',
      title: 'Otsikko',
      total: 'Summa',
      status: 'Tila',
      actions: 'Toiminnot',
      contact: 'Yhteystiedot',
      iban: 'IBAN',
      items: 'Kulut',
      mileages: 'Matkat',
      select_account: 'Valitse kirjanpito-tili',
      attachments: 'Tositteet',
      not_receipt: 'Lisäliite',
      route: 'Reitti',
      plate_number: 'Rekisterinumero',
      select: 'Valitse...'
    },
    table_pagination: {
      previous: 'Edellinen',
      next: 'Seuraava',
      page: 'Sivu',
      of: '/',
      no_data_available: 'Ei tietoja saatavilla',
      select: 'Valitse...',
      per_page: '/ sivu'
    },
    status: {
      submitted: 'VASTAANOTETTU',
      approved: 'HYVÄKSYTTY',
      paid: 'MAKSETTU',
      denied: 'HYLÄTTY',
      archived: 'ARKISTOITU',
      active: 'AKTIIVINEN'
    },
    filter: {
      all_statuses: 'Kaikki tilat',
      all: 'Kaikki',
      active_only: 'Vain aktiiviset',
      archived_only: 'Vain arkistoidut',
      submitted: 'Vastaanotettu',
      approved: 'Hyväksytty',
      paid: 'Maksettu',
      denied: 'Hylätty',
      filter: 'Suodata',
      reset: 'Nollaa',
      ok: 'OK',
      name_placeholder: 'Suodata nimellä',
      title_placeholder: 'Suodata otsikolla',
      total_placeholder: 'Min. summa',
      date_placeholder: 'Päivämäärästä',
      start_date: 'Aloituspäivä',
      end_date: 'Lopetuspäivä',
      search_in_filters: 'Hae suodattimista'
    },
    actions: {
      pdf: 'PDF',
      csv: 'CSV',
      zip: 'ZIP',
      edit: 'Muokkaa',
      approve: 'Hyväksy',
      deny: 'Hylkää',
      pay: 'Merkitse maksetuiksi',
      reset: 'Nollaa',
      archive: 'Arkistoi'
    },
    selection: {
      entries_selected:
        '{entries, plural, =1 {hakemus} other {hakemusta}} valittu',
      status: 'Tila',
      mixed_statuses:
        'Sekalaiset tilat - jotkut toiminnot eivät ole käytettävissä'
    },
    bulk_actions: {
      approve_selected: 'Hyväksy valitut',
      deny_selected: 'Hylkää valitut',
      mark_as_paid: 'Merkitse maksetuiksi',
      reset_selected: 'Nollaa valitut',
      archive_selected: 'Arkistoi valitut',
      download_zip: 'Lataa ZIP',
      remove_old_archived: 'Poista vanhat arkistoidut hakemukset',
      copy_clipboard_text: 'Kopioi leikepöydälle'
    }
  },
  AdminEntryExpandedRow: {
    select: 'Valitse...'
  },
  ApproveModal: {
    title: 'Hyväksy hakemus',
    date: 'Hyväksymispäivä',
    date_error: 'Valitse hyväksymispäivä',
    approval_note: 'Hyväksymismerkintä',
    approval_note_error: 'Anna hyväksymismerkintä',
    approval_note_placeholder: 'Raadin kokous xx/yy',
    submit: 'Hyväksy',
    cancel: 'Peruuta',
    close: 'Sulje'
  },
  PayModal: {
    title: 'Merkitse maksetuiksi',
    date: 'Maksupäivä',
    date_error: 'Valitse maksupäivä',
    submit: 'Merkitse maksetuiksi',
    cancel: 'Peruuta',
    close: 'Sulje'
  },
  DeleteOldArchivedModal: {
    title: 'Poista vanhat arkistoidut hakemukset',
    text_1:
      'Haluatko varmasti poistaa vanhat arkistoidut hakemukset? Tätä toimintoa ei voi perua.',
    text_2:
      'Varmista, että jokaisen maksetun hakemuksen PDF on arkistoitu Procountoriin.',
    remove: 'Poista',
    cancel: 'Peruuta',
    close: 'Sulje'
  },
  PreviewModal: {
    close: 'Sulje',
    is_not_receipt: 'Lisäliite'
  }
} as const

export default fi
