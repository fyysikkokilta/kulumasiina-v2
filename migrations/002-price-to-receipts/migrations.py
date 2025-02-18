from sqlite_migrate import Migrations

migration = Migrations("Price to attachments")


@migration()
def price_to_attachments(db):
    db["receipt"].add_column("value_cents", float)
    db["receipt"].add_column("is_not_receipt", bool, not_null_default=False)
    db.rename_table("receipt", "attachment")

    db["item"].transform(drop=["value_cents"])
