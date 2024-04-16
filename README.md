# Kulumasiina

Kulukorvauslomake Fyysikkokillalle.

## Dev setup

1. Install Node, npm, python 3 and pdm
2. Run `pdm install` and `npm install` on root folder
3. Start the program by running `pdm dev` and `npm start`

## Paths

- GET `/` - Index page the actual form
- GET `/login` - Google SSO login page
- GET `/admin` - Admin page for handling expense compensations

## High prio TODO

- Show user if sending the form fails.
- Liitenumerot myös PDF-liitteisiin
- Frontend hakee backendistä config-tiedot (esimerkiksi kilometrikorvauksen suuruus)

## Muuta TODO

- Front muista admin `hyväksytty` kentän tekstin ja päivämäärän
- IBAN validaatio backendissä
- HETU validaatio frontendissä sekä backendissä

## Nice to have

- [ ] Postgres db
- [ ] Login token refreshaus
- [ ] Migraatiotuki
- [ ] CI/CD (not gonna happen :D)
- [ ] Kirjanpitotilien numeroiden tallentaminen item ja mileage tasolla kantaan (mukaan csv tiedostoihin ja pöytäkirjatekstiin)
