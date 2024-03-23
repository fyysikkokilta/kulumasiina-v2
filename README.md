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

## Muuta TODO

- Front muista admin `hyväksytty` kentän tekstin ja päivämäärän
- IBAN validaatio backendissä
- HETU validaatio frontendissä sekä backendissä

## Nice to have

- [ ] Postgres db
- [ ] Login token refreshaus
- [ ] Migraatiotuki
- [ ] CI/CD (not gonna happen :D)

- Enable travel reimbursement once social security number storage guidelines are set
