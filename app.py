from flask import Flask, render_template, request, session, jsonify, send_from_directory
from flask import make_response, redirect, url_for
import os
import random
from urllib.parse import unquote
import sys
from LLMResponse import LLMResponse
import uuid

app = Flask(__name__)
app.secret_key = os.urandom(24)

llm = LLMResponse()

INTRODUCTION_MSG = "Hi! I am MatAssist. I can provide information about mineral commodities such as material production, reserve, country-wise market share, imports, exports, recycling resources, price and substitutes.How can I assist you today?"

@app.before_request
def before_request():
    if 'session_ids' not in session:
        session['session_ids'] = []
    
        
@app.route('/')
def index():
    session_ids = session.get('session_ids')
    session_id = str(uuid.uuid4())
    session_ids.append(session_id)
    
    session['session_ids'] = session_ids
    session.modified = True
    
    print("session_id :::::::",session_id)
    return render_template('index.html', session_id=session_id)


@app.route('/data/HHI_production_long.csv')
def download_HHI_production_long():
    return send_from_directory('static/data/','HHI_production_long.csv')

@app.route('/data/HHI_reserve_long.csv')
def download_HHI_reserve_long():
    return send_from_directory('static/data/','HHI_reserve_long.csv')

@app.route('/data/HHI_pperiodic_table.csv')
def download_HHI_periodic_table():
    return send_from_directory('static/data/','periodic_table.csv')

    
@app.route('/send_message', methods=['GET'])
def send_message():
    session_id = request.args.get('session_id')
    if session_id is None or session_id == "" or session_id not in session['session_ids']:
        return redirect(url_for('index'))
    
    message = request.args.get('message')
    message = unquote(message)  # Decoding URL encoded message
    
    user_chat_memory = None #variable initialization
    if 'chat_history' not in session:
        session['chat_history'] = {}
    if session_id in session['chat_history']:
        user_chat_memory = session['chat_history'][session_id]
    
    llm_response, user_chat_memory = llm.get_llm_response(message, maintained_memory = user_chat_memory)
    session['chat_history'][session_id] = user_chat_memory
    session.modified = True
    
    
    return jsonify(llm_response)

@app.route('/get_messages', methods=['GET'])
def get_messages():
    return jsonify(INTRODUCTION_MSG)

@app.route('/cleanup', methods=['GET'])
def cleanup():
    session_id = request.args.get('session_id')
    session_ids = session.get('session_ids')
    
    print(session_ids)
    
    if session_id in session_ids:
        session_ids.remove(session_id)
    
    if 'chat_history' in session and session_id in session['chat_history']:
        del session['chat_history'][session_id]
    
    session['session_ids'] = session_ids
    
    session.modified = True
    
    print(session_ids)
    
    return jsonify({"result":"success"})

@app.route('/refresh', methods=['GET'])
def refresh():
    session_id = request.args.get('session_id')
    session_ids = session.get('session_ids')
    
    print(session_ids)
    
    if session_id in session_ids and 'chat_history' in session and session_id in session['chat_history']:
        session['chat_history'][session_id] = {'inputs':[], 'outputs':[]}
        session.modified = True
        
    
    return jsonify(INTRODUCTION_MSG)
        
if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port = 8080)
    app.config.update(SESSION_COOKIE_SAMESITE="None", SESSION_COOKIE_SECURE=True)
    app.config['SESSION_PERMANENT'] = False
    
