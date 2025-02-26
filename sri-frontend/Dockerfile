# Χρησιμοποιούμε node ως βάση
FROM node:22.8

# Ορίζουμε το working directory
WORKDIR /app

# Αντιγράφουμε τα dependencies και τα εγκαθιστούμε
COPY package.json package-lock.json ./
RUN npm install

# Αντιγράφουμε όλο το frontend
COPY . .

# Εκθέτουμε τη θύρα 3000 για το ReactJS frontend
EXPOSE 3000

# Εκκίνηση του frontend
CMD ["npm", "start"]
