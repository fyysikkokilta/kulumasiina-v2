# Kulumasiina

Kulukorvauslomake Fyysikkokillalle.

## Dev setup

1. Install Node, npm, python 3 and pdm
2. Run `pdm install` and `npm install` on root folder
3. Start the program by running `pdm dev` and `npm start`

## DB Migrations

Migrations are to be applied manually. Install sqlite-utils by following instructions at https://github.com/simonw/sqlite-migrate.
Migrations are saved in migrations folder and each migration should have its own subfolder and a migrations.py file.

Refer https://github.com/simonw/sqlite-migrate on how to apply migrations. When applying migrations to production please backup the database to make sure the change can be reverted if the migration fails.


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
- [ ] CI/CD (not gonna happen :D)
