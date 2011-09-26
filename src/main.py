#! coding: utf-8
# pylint: disable-msg=W0311
import os
from uuid import uuid4
from hashlib import md5
from time import time
from simplejson import dumps
from mimemagic import from_buffer as mimetype
from flask import Flask, request, send_from_directory, render_template, abort

from memcache import Client as Memcache
from pymongo import Connection
from pymongo.son import SON
from pymogile import Client

from img_utils import zoom

DATABASE = Connection('192.168.5.107:27017').foo
DATASTORE = Client(domain='vcmedia', trackers=['192.168.5.105:7001'])
CACHE = Memcache(['127.0.0.1:11211'], debug=0)

app = Flask(__name__)

    
    
import string
ALPHABET = string.ascii_uppercase + string.ascii_lowercase + \
           string.digits + '-_'
ALPHABET_REVERSE = dict((c, i) for (i, c) in enumerate(ALPHABET))
BASE = len(ALPHABET)
SIGN_CHARACTER = '$'    

def _id_encode(n):
  s = []
  while True:
    n, r = divmod(n, BASE)
    s.append(ALPHABET[r])
    if n == 0: break
  return ''.join(reversed(s))
    
def _get_next_id():
  result = DATABASE.command(SON({'findandmodify': 'auto_increment'},
                                query={'_id': 'global'},
                                update={'$inc': {'auto_increment': 1}},
                                upsert=True))
  return result['value'].get('auto_increment', 0)

def new_id():
  id = _get_next_id()
  return _id_encode(id)

def get_files(uid):
  if not uid:
    return []
  else:
    files = DATABASE.file.find({'uid': uid}).sort('ts', -1)
    return list(files)
  
def get_file_data(fid):
  info = DATABASE.file.find_one({'_id': fid})
  app.logger.debug(info)
  if info:
    return DATASTORE.get_file_data(info.get('md5'))
  else:
    return None
  
def save_file(uid, file):
  """ @file: FileStorage object """
  filedata = file.stream.read()
  md5sum = md5(filedata).hexdigest()
  info = DATABASE.file.find_one({'md5': md5sum, 'uid': uid})
  if not info:
    info = {'uid': uid,
            'name': file.filename,
            'md5': md5(filedata).hexdigest(),
            'ts': time(),
            '_id': new_id()}
    DATABASE.file.insert(info)
    fp = DATASTORE.new_file(info['md5'])
    fp.write(filedata)
    fp.close()
  return info['_id']
  
  
@app.route("/assets/<path:filename>")
def public_files(filename):
  src = os.path.dirname(__file__)
  return send_from_directory(os.path.join(src, 'assets'), filename)

@app.route('/')
def home():
  uid = request.cookies.get('uid')
  files = get_files(uid)
  app.logger.debug(files)
  response = app.make_response(render_template('index.html', files=files))
  if not uid:
    response.set_cookie('uid', str(uuid4()), 365*24*60*60)
  return response

@app.route("/upload", methods=["POST"])
def upload():
#  app.logger.debug(request.files['pic'])
  uid = request.cookies.get('uid')
  fid = save_file(uid, request.files['pic'])
  return dumps({'status': 'OK',
                'fid': fid})
  
@app.route("/i<fid>.png")
def file(fid):
  filedata = get_file_data(fid)
  if not filedata:
    abort(404, 'File not found')
  response = app.make_response(filedata)
  response.headers['Content-Type'] = mimetype(filedata[:1024])
  response.headers['Content-Length'] = len(filedata)
  return response

@app.route("/p<fid>.png")
def preview(fid):
  key = 'z' + fid
  key = str(key)
  filedata = CACHE.get(key)
  if not filedata:
    filedata = get_file_data(fid)
    if not filedata:
      abort(404, 'File not found')
    filedata = zoom(filedata, 640, 480)
    CACHE.set(key, filedata)
  response = app.make_response(filedata)
  response.headers['Content-Type'] = mimetype(filedata[:1024])
  response.headers['Content-Length'] = len(filedata)
  return response

@app.route("/z<fid>.png")
def thumbnail(fid):
  key = 'z' + fid
  key = str(key)
  filedata = CACHE.get(key)
  if not filedata:
    filedata = get_file_data(fid)
    if not filedata:
      abort(404, 'File not found')
    filedata = zoom(filedata, 200, 200)
    CACHE.set(key, filedata)
  response = app.make_response(filedata)
  response.headers['Content-Type'] = mimetype(filedata[:1024])
  response.headers['Content-Length'] = len(filedata)
  return response
  


if __name__ == '__main__':
  app.run(debug=True, host='0.0.0.0')