import os
import json
#from langchain.chat_models import ChatOpenAI
from langchain_community.chat_models import ChatOpenAI
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser
from langchain.schema.runnable import RunnablePassthrough
import constants  # Assuming constants.py is in the same directory

def generate_rag_response(name, query):
    os.environ["OPENAI_API_KEY"] = constants.OPENAI_API_KEY
    openai = ChatOpenAI(model="gpt-4")
    embedding_model = OpenAIEmbeddings()
    loaded_vectors = FAISS.load_local(name, embedding_model, allow_dangerous_deserialization = True)
    retriever = loaded_vectors.as_retriever(search_type="similarity_score_threshold", search_kwargs={"score_threshold": .3, "k": 2})
    
    RAG_PROMPT = """
    CONTEXT: {context}
    QUERY: {question}
    주어진 QUERY에 대해서, 관련이 높은 내용이 CONTEXT에 있다면 활용해서 대답해주세요! 경쾌하고 친절하게 대답해주세요! 교수님한테 문의하거나 질문하라고 하지마세요. 답변에 Python코드가 포함되어 있으면 해당 코드 부분을 ```로 감싸주세요. 상세하게 답변해주세요.
    """

    rag_prompt = ChatPromptTemplate.from_template(RAG_PROMPT)

    rag_chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | rag_prompt
        | openai
        | StrOutputParser()
    )
    response = rag_chain.invoke(query)
    data = {}
    data['answer'] = response

    return data

