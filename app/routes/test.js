utmToCampaignName =\
    spark\
    .read\
    .format("jdbc")\
    .options(
        url = f"jdbc:postgresql://{INTELLSYS_LIVPURE_HOSTNAME}:5432/postgres",
        user = INTELLSYS_LIVPURE_USERNAME,
        password = INTELLSYS_LIVPURE_PASSWORD,
        driver = "org.postgresql.Driver",
        query = """
            SELECT
                *
            FROM
                captured_utm_campaign_to_campaign_name
        """,    
    )\
    .load()

utmToCampaignName.show()
