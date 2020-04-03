from flask import Flask, render_template, request, send_from_directory
import os
import time
import atexit
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)

@app.route('/')
def send_index():
    return send_from_directory('./', 'index.html')
    
@app.route('/site/<path:path>')
def send_site(path):
    if path.endswith(".mjs"):
        return send_from_directory('./site', path, as_attachment=True, mimetype='text/javascript')
    else:
        return send_from_directory('./site', path)

def main():

    port = int(os.environ.get('PORT', 80))
    app.run(host='0.0.0.0', port=port, debug=False)

if __name__ == '__main__':
    main()
