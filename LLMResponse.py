import os
from pprint import pprint
from langchain.memory import ConversationBufferMemory

# from langchain.document_loaders import PyPDFLoader
# from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma

from langchain.prompts import PromptTemplate
from langchain import HuggingFaceHub

from langchain.chains import RetrievalQA
from langchain.chains import ConversationalRetrievalChain
from langchain.chains import LLMChain
from langchain.retrievers import MergerRetriever

DATA_FILES_PATH = "docs/"
MODEL_EMBEDDING_NAME = "WhereIsAI/UAE-Large-V1"

VECTOR_DB_DIR_PDF= 'chroma_UAE_pdfs/'
VECTOR_DB_DIR_JSON= 'chroma_UAE_jsons/'

MODEL_LLM_NAME = "meta-llama/Meta-Llama-3-8B-Instruct"

NO_RESPONSE_MSG = "I apologize; I don't have a response to your query. Please rephrase your question to provide more details."

from datetime import datetime

class LLMResponse():
    def __init__(self) -> None:
        self.vectordb_pdf= self.get_vectordb(VECTOR_DB_DIR_PDF, 
                 embedding_model_name = MODEL_EMBEDDING_NAME)
        
        self.vectordb_json= self.get_vectordb(VECTOR_DB_DIR_JSON, 
                 embedding_model_name = MODEL_EMBEDDING_NAME)
        self.retriever_pdf = self.vectordb_pdf.as_retriever(search_kwargs={'k':5})
        self.retriever_json = self.vectordb_json.as_retriever(search_kwargs={'k':15})
        
        self.hf_llm =HuggingFaceHub(
                            repo_id = MODEL_LLM_NAME,

                            huggingfacehub_api_token="XXXXXXXXXXXXXXXX", ## use your hugging face hub access token
                            model_kwargs={"temperature":0.1, "max_new_tokens":2000}
                            )

    def get_vectordb(self, vectordb_path:str, 
                    embedding_model_name = MODEL_EMBEDDING_NAME):
        '''
            vectordb_path : Path of the vector database
            embedding_model_name : Embedding model name from Huggingface
            model_kwargs: dictionary for additional parameters for the embedding model
            loading_data_dir : None (Default). Path of the data directory. Set to None if data is already loaded to the vector database
            enrich_metadata: True(default). If True then metadata is augumented from the file names.
            chunk_size: 1500 (default).
            chunk_overlap: 100 (default).
        '''
        embedding = HuggingFaceEmbeddings(
                        model_name = embedding_model_name)
        
        # vectordb = None
        vectordb = Chroma(persist_directory=vectordb_path,
                    embedding_function = embedding)
            
        return vectordb


    def get_llm_response(self, question:str, maintained_memory = None, return_source_documents = False, history_len = 5) -> str:
    
        local_memory = []
        user_system_conversation = []
        if maintained_memory is not None:
            for i in range(len(maintained_memory['inputs'])):
                local_memory.append(f'<|start_header_id|>user<|end_header_id|> { maintained_memory["inputs"][i]["question"] }<|eot_id|>')
                local_memory.append(f'<|start_header_id|>assistant<|end_header_id|> { maintained_memory["outputs"][i]["result"] }<|eot_id|>')
                # local_memory.append(maintained_memory['inputs'][i]["question"])
                # local_memory.append(maintained_memory['outputs'][i]["result"])
                user_system_conversation.append(f'user : {maintained_memory["inputs"][i]["question"]} \n')
                user_system_conversation.append(f'system : {maintained_memory["outputs"][i]["result"]} \n')
        else:
            maintained_memory = {'inputs':[], 'outputs':[]}
        

        local_memory = " ".join(local_memory)
        user_system_conversation = "".join(user_system_conversation)
        

        q_format_template = "<|begin_of_text|> conversation history <history_begin>: "+user_system_conversation + """<history_end> \n
            You are expert in asking question. Please reformat the user question as a stand alone question relevant to mineral commodities and contained as possible with the required information inferred from conversation history if needed. 
            If the question contains sufficient information about material, year then do not change the question.
            Your response should be brief and should be either relevant reformated question or user question as it is. Do not alter the tone, theme, and formats of the user question. You must NOT answer user's questions as your job is to refine the question. 
            Please note that hhi(HHI) represents Herfindahl-Hirschman Index. Do not alter the greetings. Do not change the abbreviations and names of the materials and countries. 
            Do not mention 'Please provide the question you'd like me to reformat.' or similar responses.
            You may use the conversation history to refine the question and infer additional information like year, country, and material etc if only necessary.
            If year is not mentioned then assume it for the current year 2023. If country is not mentioned in conversation history, then you may assume it is for USA.
            Return only the formatted question and if formating is not required, then return the original question as it is. if no question to reformat then return only 'FALSE'.
            If you are not confident then return 'FALSE'.
            <|start_header_id|>user<|end_header_id|> Question: '{question}'\n
            <|eot_id|><|start_header_id|>assistant<|end_header_id|>
            """
            
        q_QA_CHAIN_PROMPT = PromptTemplate(input_variables=["question"],template=q_format_template)
        # Run chain
        
        q_qa_chain = LLMChain(llm = self.hf_llm, prompt = q_QA_CHAIN_PROMPT)
        q_res = q_qa_chain.run(question)
        
        
    
        q_res = q_res.split("<|eot_id|><|start_header_id|>assistant<|end_header_id|>")
        if len(q_res) > 0:
            q_res = q_res[-1]
            q_res = q_res.split("<end_of_turn>")[0]
        else:
            q_res = question
            
        if q_res.strip() == "FALSE":
            q_res = question
                
        print("=^=^"*20)
        print(q_res)
        print("=^=^"*20)
        
        question = q_res
        
        template = "<|begin_of_text|> Your name is MatAssist. You are an expert in mineral commodities and a helpful, smart, intelligent, sensible and user friendly assistant.\
            Please do not repeat your name and introduction if already present in the conversation history.\
            You are knowledgeable about mineral commodities such as material production, reserve, country-wise market share, imports, exports, recycling resources, price , substitutes, events, trends and issues.\
            If the user's question is of greetings, acknowledgments type or generic queries, then you can ignore the context and respond back with your intelligence and user friendliness.\
            Answer the query without unnecessary verbose by using the reports in the context and chat history. Please note that hhi represents Herfindahl-Hirschman Index. If you are not confident, respond to the user gracefully and request that more details be provided.\
            If you find the context is not appropriate, then request the user to refine the query further with a specific country, material, and year.\
            If any year is not mentioned, then assume it is for the current year 2023.\
            If user asks about HHI, market share then give prority to the information in the JSON to answer.\
            If you are referring to information from the conversation history, then mention that you inferred from a previous conversation with the user and that you quickly forget things because of limited memorization capability.\
            If you don't find an appropriate answer, you must inform the user gracefully and ask the user to refine the question with further details." + local_memory + """<|start_header_id|>user<|end_header_id|>           
            Question: "{question}" \n
            Context: "{context} "
            <|eot_id|><|start_header_id|>assistant<|end_header_id|>
            """
            


        QA_CHAIN_PROMPT = PromptTemplate(input_variables=["question", "context"],template=template)
        # Run chain
        self.lotr = MergerRetriever(retrievers=[self.retriever_pdf,self.retriever_json])
        
        qa_chain = RetrievalQA.from_chain_type(self.hf_llm,
                                            retriever=self.lotr,
                                            return_source_documents = False,
                                            chain_type_kwargs={"prompt":QA_CHAIN_PROMPT})
        
        
        result = qa_chain({"query": question})
        
        res = result["result"]
        
        print("**"*50)
        print(result)

        if not return_source_documents:
            res = res.split("<|eot_id|><|start_header_id|>assistant<|end_header_id|>")
            if len(res) > 0:
                res = res[-1]
                res = res.split("<end_of_turn>")[0]
                res = res.strip()
                if len(res) == 0:
                    res = NO_RESPONSE_MSG
            else:
                res = NO_RESPONSE_MSG
        
        # maintained_memory['inputs'].append({"question":f'<|begin_of_text|><|start_header_id|>user<|end_header_id|>{ question }<|eot_id|>'})
        # maintained_memory['outputs'].append({"result":f'<|start_header_id|>assistant<|end_header_id|>{ res }<|eot_id|>'})
        
        maintained_memory['inputs'].append({"question": question })
        maintained_memory['outputs'].append({"result": res })
        
        
        if len(maintained_memory['inputs']) > history_len:
            maintained_memory['inputs'] = maintained_memory['inputs'][-history_len::]
            maintained_memory['outputs'] = maintained_memory['outputs'][-history_len::]
        return res, maintained_memory
    
