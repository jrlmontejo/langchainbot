# Langchainbot

## Getting Started

Install dependencies:
```bash
yarn
```

Create an `.env` file from `.env.example` and update the environment variables:
```
OPENAI_API_KEY=

# Update these with your pinecone details from your dashboard.
# PINECONE_INDEX_NAME is in the indexes tab under "index name" in blue
# PINECONE_ENVIRONMENT is in indexes tab under "Environment". Example: "us-east1-gcp"
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
PINECONE_INDEX_NAME=
PINECONE_NAMESPACE=
```

Then run the development server:

```bash
yarn dev
```

Visit http://localhost:3000.

## Data Ingest

Put your PDF documents in `/docs` folder. Then run:
```bash
yarn ingest
```
This creates the embeddings from the documents and uploads them to Pinecone vector store. The script is located at `/scripts/ingest.ts`.

## Folder Structure

The main frontend code is in `/pages/index.tsx`.

The API call to Langchain is in `/pages/api/chat.ts`.

The prompt design is in `/utils/makechain.ts`.