# Kulumasiina

Kulukorvauslomake Fyysikkokillalle.

## Paths

- GET `/` - Index page the actual form


## Joonan TODO
- [] PDF dokumenttiin merkintä hyväksymisestä ja maksamispäivämäärä
  - Hyväksymiselle tekstikenttä, mikä kokous / milloin allekirjoitettu
- Admin puoli redirect loginiin jos ei ole kirjautunut
- Admin puolen modal/popup x:n painallus ei sulje modalia
- Luotu PDF hajoaa jos vaakatasossa oleva kuva
  - Uploadin tulee epäonnistua mikäli tiedosto invalidi backendissä (punaiset framet liitteen previewssä)
- Nimen & korvausstatuksen perusteella filtteröinti admin puolelle
- Poistosta "arkistoi", jolloin status ei enää muutettavissa.
- Arkistoidut `entry`t pystyy poistamaan vain erillisellä dialogilla
  - Myöhemmin ihmettelyä voiko `receipt` poistaa, jos `entry` on arkistoitu ja siitä on tallennettu PDF.
- PDF dokumentille nimi.
  `Etunimi_Sukunimi-[dd]-[mm]-[yyyy]-[entry id].pdf`
- Admin puolelta ajoista `T` pois, muuten ISO 8601
- IBAN validointi frontendissä


## Nice to have
- [ ] Postgres db
- [ ] Vanhojen kuittien/korvausten arkistointi -> Zip pdf lataus (Uusi tila "arkistoitu" näille)
- [ ] Filtteröinti rahisnäkymään
- [ ] Login token refreshaus
- [ ] Migraatiotuki
- [ ] CI/CD (not gonna happen :D)
- Make receipt table TTL (1d) and generate PDFs on the fly
  - Add the PDF to the `entry` table

- Do not allow sending receipt without date
- Do not allow sending receipt without amount
- Do not allow sending receipt without description
- Do not allow sending receipt without receipt image/pdf

- If entries request gives 401 (expired token or no token) -> redirect to login page
- Enable travel reimbursement once social security number storage guidelines are set
- reject invalid receipt files

- show id/number in admin list view