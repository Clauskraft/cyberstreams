"""
update_vector_db.py

This utility is invoked by the runScraper.ts script to update the vector
database used by the Cyberstreams platform.  It reads a JSON file containing
an array of textual documents, computes a TF‑IDF matrix using scikit‑learn,
and serialises the resulting vectorizer and matrix alongside metadata.

Usage:
    python update_vector_db.py path/to/scraped_texts.json

Requires:
    - scikit‑learn installed in the Python environment
    - numpy and pickle (standard libraries)

The output is written to ../vector_db.pkl relative to this script.
"""

import json
import os
import sys
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer


def main():
    if len(sys.argv) < 2:
        print("Usage: python update_vector_db.py <input_json>")
        sys.exit(1)
    input_path = sys.argv[1]
    with open(input_path, 'r', encoding='utf-8') as f:
        texts = json.load(f)
    # Ensure we have a list of strings
    documents = [str(t) for t in texts if isinstance(t, str)]
    if not documents:
        print("No documents to index.")
        return
    vectorizer = TfidfVectorizer(stop_words='english')
    X = vectorizer.fit_transform(documents)
    vector_db = {
        'documents': [ {'id': f'doc-{i+1}', 'content': doc} for i, doc in enumerate(documents) ],
        'tfidf': X,
        'vectorizer': vectorizer
    }
    out_path = os.path.join(os.path.dirname(__file__), '..', 'vector_db.pkl')
    with open(out_path, 'wb') as f:
        pickle.dump(vector_db, f)
    print(f"Vector database updated with {X.shape[0]} documents and {X.shape[1]} features. Saved to {out_path}")


if __name__ == '__main__':
    main()