# Χρησιμοποιούμε μια lightweight εικόνα Python
FROM python:3.12.5

# Ορίζουμε το working directory
WORKDIR /app

# Αντιγράφουμε τα dependencies
COPY requirements.txt .

# Εγκαθιστούμε τα πακέτα
RUN pip install --no-cache-dir -r requirements.txt

# Αντιγράφουμε τον υπόλοιπο κώδικα
COPY . .

# Εκθέτουμε τη θύρα του FastAPI
EXPOSE 8000

# Εκτελούμε την εφαρμογή
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
