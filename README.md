# Kulumasiina

Kulukorvauslomake Fyysikkokillalle.

## Paths

- GET `/` - Index page the actual form


## TODO NYT
- pdf generointi
- login toimimaan
- login token kesto

## Nice to have
- [ ] Useita käyttäjiä
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


- expense