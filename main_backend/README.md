1. Create file `.secrets.json` and write there
    {
        "EMAIL_HOST_USER": <HOST_EMAIL>,
        "EMAIL_HOST_PASSWORD": <HOST_EMAIL_PASSWORD>
    }

    to support email sending

2. To start the server run
```bash
python manage.py runserver 8000
```