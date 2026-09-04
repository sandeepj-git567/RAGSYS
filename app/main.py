from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.rag import create_vectorstore, ask_question



app = FastAPI(
    title="PDF RAG API",
    description="AI-powered PDF Question Answering API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ragsys-ebon.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Store the current vector database
vectorstore = None


class QuestionRequest(BaseModel):
    question: str


@app.get("/")
def home():
    return {
        "message": "PDF RAG API is running"
    }


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    global vectorstore

    # Check file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    # Read uploaded PDF
    pdf_bytes = await file.read()

    try:
        vectorstore = create_vectorstore(pdf_bytes)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    return {
        "message": "PDF uploaded and processed successfully",
        "filename": file.filename
    }


@app.post("/ask")
def ask(request: QuestionRequest):

    if vectorstore is None:
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF first"
        )

    result = ask_question(
        request.question,
        vectorstore
    )

    return result