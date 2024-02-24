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

## Muuta TODO
- Front muista admin `hyväksytty` kentän tekstin ja päivämäärän
- IBAN validaatio backendissä
- Filtteröinti lähetyspäivän mukaan date rangena (ei suoraan tuettu käytetyssä fronttikirjastossa)


## Nice to have
- [ ] Postgres db
- [ ] Vanhojen kuittien/korvausten arkistointi -> Zip pdf lataus
- [ ] Login token refreshaus
- [ ] Migraatiotuki
- [ ] CI/CD (not gonna happen :D)
- Make receipt table TTL (1d) and generate PDFs on the fly
  - Add the PDF to the `entry` table

- Enable travel reimbursement once social security number storage guidelines are set
