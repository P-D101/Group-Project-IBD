from flask import g
import sqlite3
import os.path
from datetime import datetime, timezone

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


def ensure_tickets_table():
    db = get_db()
    db.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receiver TEXT NOT NULL DEFAULT '',
            description TEXT NOT NULL DEFAULT '',
            raised_at DATETIME NOT NULL DEFAULT (DATETIME('now'))
        )
    """)
    db.commit()


def insert_ticket(receiver, description):
    db = get_db()
    ensure_tickets_table()
    raised_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    cur = db.execute(
        "INSERT INTO tickets (receiver, description, raised_at) VALUES (?, ?, ?)",
        [receiver, description, raised_at],
    )
    db.commit()
    return cur.lastrowid


def get_tickets(limit=50):
    ensure_tickets_table()
    rows = query(
        "SELECT id, receiver, description, raised_at FROM tickets ORDER BY raised_at DESC LIMIT ?",
        [limit],
    )
    if not rows:
        return []
    return [
        {"id": r[0], "receiver": r[1], "description": r[2], "raised_at": r[3]}
        for r in rows
    ]
