FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# 🔥 INSTALL NETCAT (VERY IMPORTANT FOR REDIS + MYSQL WAIT)
RUN apt-get update && apt-get install -y netcat-openbsd

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY . .

# 🔥 COPY WAIT SCRIPT
COPY wait-for-db.sh /wait-for-db.sh
RUN chmod +x /wait-for-db.sh

EXPOSE 8000

# 🔥 RUN WAIT SCRIPT INSTEAD OF DAPHNE DIRECTLY
CMD ["sh", "/wait-for-db.sh"]