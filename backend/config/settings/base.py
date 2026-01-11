import os
from dotenv import load_dotenv

ENV = os.getenv("DJANGO_ENV", "dev")

if ENV == "prod":
    load_dotenv(".env.prod")
else:
    load_dotenv(".env.dev")
