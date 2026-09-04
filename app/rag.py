import os
import io

from dotenv import load_dotenv
from pypdf import PdfReader

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS

from langchain_google_genai import (
    GoogleGenerativeAIEmbeddings,
    ChatGoogleGenerativeAI
)


load_dotenv()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found")


# ----------------------------------
# Gemini Embeddings
# ----------------------------------

embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-001",
    google_api_key=GEMINI_API_KEY
)


# ----------------------------------
# Gemini LLM
# ----------------------------------

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    google_api_key=GEMINI_API_KEY
)


# ----------------------------------
# Create Vector Store
# ----------------------------------

def create_vectorstore(pdf_bytes: bytes):

    # Read PDF from memory
    pdf = PdfReader(io.BytesIO(pdf_bytes))

    text = ""

    for page in pdf.pages:

        extracted_text = page.extract_text()

        if extracted_text:
            text += extracted_text + "\n"


    if not text.strip():
        raise ValueError(
            "Could not extract text from the PDF"
        )


    print("PDF text extracted successfully")


    # ----------------------------------
    # Split text
    # ----------------------------------

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )

    chunks = splitter.split_text(text)


    print(f"Total chunks: {len(chunks)}")


    # ----------------------------------
    # Create FAISS
    # ----------------------------------

    vectorstore = FAISS.from_texts(
        texts=chunks,
        embedding=embeddings
    )


    print("FAISS vector database created")


    return vectorstore


# ----------------------------------
# Ask Question
# ----------------------------------

def ask_question(
    query: str,
    vectorstore
):

    # Search relevant chunks
    docs = vectorstore.similarity_search(
        query,
        k=3
    )


    # Combine context
    context = "\n\n".join(
        doc.page_content
        for doc in docs
    )


    # ----------------------------------
    # Prompt
    # ----------------------------------

    prompt = f"""
You are a PDF Question Answering Assistant.

Answer the user's question using ONLY
the information provided in the context.

Rules:

1. Use only the context.
2. Do not invent information.
3. If the answer is not available in the context,
   say exactly:

"I couldn't find that information in the PDF."

4. Give a clear and concise answer.

Context:
{context}

Question:
{query}

Answer:
"""


    # ----------------------------------
    # Gemini
    # ----------------------------------

    response = llm.invoke(prompt)


    return {
        "answer": response.content,
        "sources": [
            doc.page_content
            for doc in docs
        ]
    }