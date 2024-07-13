from fastapi import FastAPI, HTTPException, Request, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uvicorn
import os
from datetime import datetime
from rag_module import generate_rag_response

from langchain_community.chat_models import ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_community.vectorstores import FAISS

from langchain_community.embeddings import OpenAIEmbeddings
import tiktoken
import numpy as np
from numpy.linalg import norm
import locale
import constants
name = ""
os.environ["OPENAI_API_KEY"] = constants.OPENAI_API_KEY

def tiktoken_len(text):
    tokens = encoding.encode(text)
    return len(tokens)

def cosine_similarity(vec_1, vec_2):
    return np.dot(vec_1, vec_2) / (norm(vec_1) * norm(vec_2))

locale.getpreferredencoding = lambda: "UTF-8"

openai_model = "gpt-4o"
openai = ChatOpenAI(model_name=openai_model)
encoding = tiktoken.encoding_for_model(openai_model)
embedding_model = OpenAIEmbeddings()
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=256,
    chunk_overlap=20,
    length_function=tiktoken_len,
    separators=["\n\n", "\n", " ", ""]
)


app = FastAPI()

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

class TextData(BaseModel):
    text_data: str

@app.get("/")
def read_root():
    return {"message": "Server is running"}


clients = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients.remove(websocket)


@app.post("/upload/")
async def upload_file(files: List[UploadFile] = File(...)):
    try:
        for uploaded_file in files:
    
            with open(uploaded_file.filename, "wb") as buffer:
                buffer.write(uploaded_file.file.read())

            docs = PyMuPDFLoader(uploaded_file.filename).load()
            print(f"Loaded {len(docs)} documents from {uploaded_file.filename}")

          
            split_chunks = text_splitter.split_documents(docs)
            print(len(split_chunks))
  
            vector_store = FAISS.from_documents(docs, embedding_model)
            
     
            vector_store.save_local(f"{uploaded_file.filename}_vector_store")
            global name
            name = f"{uploaded_file.filename}_vector_store"
        
            os.remove(uploaded_file.filename)
                   # 웹소켓을 통해 알림 전송
            for client in clients:
                await client.send_text(f"File {uploaded_file.filename} processed successfully and saved as {name}")

        # 모든 파일에 대한 처리가 완료되면 성공 메시지 반환
        return {"message": "모든 파일이 성공적으로 처리되었습니다."}
        # 웹소켓으로 알림 보내기
    

     
    except Exception as e:
        # 오류 발생 시 적절한 응답을 반환합니다.
        return {"error": str(e)}


@app.post("/save-log")
async def save_log(request: Request, data: dict):
    print("save-log")
    try:
        client_ip = request.client.host  # 클라이언트 IP 주소 가져오기
        print("IP:", client_ip)
        messages = data.get("messages", [])
        log_dir = "logs"
        os.makedirs(log_dir, exist_ok=True)
        file_path = os.path.join(log_dir, f"{client_ip}.txt")
        for message in messages:
            log_entry = f"Time: {datetime.utcnow().isoformat()}, Message: {message['text']}\n"     
            with open(file_path, "a") as log_file:
                log_file.write(log_entry)

        return {"message": "Log saved successfully"}

    except Exception as e:
        print(f"Error writing log file: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/chat2")
async def chat2_endpoint(text_data: TextData):
    try:
        print(f"Received text data:\n{text_data.text_data}")
        user_query = text_data.text_data
        print(name + "이 전달 되었습니다" )
        response = generate_rag_response(name, user_query)
        print(f"Response data:\n{response}")
        
        return {"answer": response['answer']}

    except Exception as e:
        print(f"Error processing text data: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
