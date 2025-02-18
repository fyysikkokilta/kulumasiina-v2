from sqlite_migrate import Migrations

migration = Migrations("Bookkeeping accounts")


@migration()
def add_bookkeeping_accounts(db):
    # db is a sqlite-utils Database instance
    db["item"].add_column("account", str)
    db["mileage"].add_column("account", str)
