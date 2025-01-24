from langchain_community.vectorstores import Chroma
from langchain.document_loaders import PyPDFLoader,JSONLoader
import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain.embeddings import HuggingFaceEmbeddings
import json
import pandas as pd 
from langchain.schema import Document

USER_DATA = "user_data"
JSON_DIR ="user_jsons"

def load_files(folder_path):
    # List to store PyPDFLoader instances
    loaders = []

    # Iterate over the files in the folder
    for filename in os.listdir(folder_path):
        # Check if the file is a PDF
        if filename.endswith(".pdf"):
            # Create PyPDFLoader instance for each PDF file
            loaders.append(PyPDFLoader(os.path.join(folder_path, filename)))

    docs = []
    for loader in loaders:
        docs.extend(loader.load())
  
    return docs



def create_vector_dB(folder_path=USER_DATA):

    docs = load_files(folder_path)

    text_splitter = RecursiveCharacterTextSplitter(
                chunk_size = 1500,
                chunk_overlap = 100,
                separators=["\n\n", "\n", " ", ""]
            )
        
    splits = text_splitter.split_documents(docs)

    embedding_model_name = "WhereIsAI/UAE-Large-V1"
    embedding = HuggingFaceEmbeddings(
                        model_name = embedding_model_name)


    vectordb = Chroma.from_documents(
                    documents=splits,
                    embedding=embedding,
                    persist_directory="chroma_UAE_user_pdfs/"  
            )


# Convert CSV files to JSON
def convert_csv_to_json(csv_directory, json_directory):
    for filename in os.listdir(csv_directory):
        if filename.endswith(".csv"):
            csv_path = os.path.join(csv_directory, filename)
            json_path = os.path.join(json_directory, filename.replace(".csv", ".json"))
            
            df = pd.read_csv(csv_path)
            json_data = df.to_dict(orient="records")
            
            with open(json_path, "w") as json_file:
                json.dump(json_data, json_file, indent=4)



# Load JSON documents using LangChain's JSON loader
def load_json_documents(json_directory, jq_schema):
    docs = []
    for filename in os.listdir(json_directory):
        if filename.endswith(".json"):
            json_path = os.path.join(json_directory, filename)
            loader = JSONLoader(file_path=json_path, jq_schema=jq_schema, text_content=False)
            json_docs = loader.load()
            
            for doc in json_docs:
                # Ensure page_content is a string
                page_content = json.dumps(doc.page_content, indent=4)  # Convert dict to string
                docs.append(Document(page_content=page_content, metadata=doc.metadata))
    return docs

def create_vector_dB_csvs(folder_path=USER_DATA,json_directory=JSON_DIR):

    convert_csv_to_json(folder_path, json_directory)

    # Define the jq_schema for JSON parsing
    jq_schema = '.[]'

    # Load JSON documents
    json_docs = load_json_documents(json_directory, jq_schema)

    # Split the documents using recursive splitters
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=100)
    splits = text_splitter.split_documents(json_docs)

    embedding_model_name = "WhereIsAI/UAE-Large-V1"
    embedding = HuggingFaceEmbeddings(
                        model_name = embedding_model_name)


    vectordb = Chroma.from_documents(
                    documents=splits,
                    embedding=embedding,
                    persist_directory="chroma_UAE_user_jsons/"
            )



if __name__ == '__main__':
    create_vector_dB(USER_DATA)
    create_vector_dB_csvs(USER_DATA,JSON_DIR)
