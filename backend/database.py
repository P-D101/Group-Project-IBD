from flask import g
import sqlite3
import os.path

DATABASE = os.path.join(os.path.dirname(__file__),'data','CloudExpenses.db')

# Database API
def get_db():
    try:
        db = getattr(g, '_database', None)
        if db is None:
            db = sqlite3.connect(DATABASE)
            g._database = db
    except Exception as e:
        print("Not in flask program, opening new connection")
        db = sqlite3.connect(DATABASE)
    return db




def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query(query, args=[], single=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()

    if not rv: return None
    if single: return rv[0]
    return rv
