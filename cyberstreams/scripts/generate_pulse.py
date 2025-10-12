"""
generate_pulse.py

This script reads the pickled vector database created by update_vector_db.py
and produces a simple "daily pulse" summary.  The intent of the
"pulse" is to provide a short preview of the most recent or
representative documents in the database.  Because there is no
official web embed for ChatGPT Pulse, this script instead
summarises existing documents collected from the monitored feeds.

Usage:
    python generate_pulse.py <vector_db_path>

The script outputs a JSON array of objects to STDOUT.  Each object
contains an ``id`` and a ``summary``.  The summary is the first
200 characters of the document content with newlines collapsed.

The Node.js API server will invoke this script to generate the pulse
data on demand.
"""

import json
import os
import sys
import pickle


def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_pulse.py <vector_db_path>")
        sys.exit(1)
    path = sys.argv[1]
    if not os.path.isfile(path):
        print(f"Vector DB not found: {path}", file=sys.stderr)
        sys.exit(1)
    with open(path, 'rb') as f:
        vector_db = pickle.load(f)
    docs = vector_db.get('documents', [])
    # Limit to top 10 documents.  If there are fewer, use all.
    top_docs = docs[:10]
    pulse = []
    for doc in top_docs:
        content = doc.get('content', '')
        # Normalise whitespace and truncate
        text = ' '.join(str(content).split())
        summary = text[:200] + ('…' if len(text) > 200 else '')
        pulse.append({'id': doc.get('id'), 'summary': summary})
    print(json.dumps(pulse, ensure_ascii=False))


if __name__ == '__main__':
    main()