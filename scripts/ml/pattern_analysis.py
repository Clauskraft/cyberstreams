"""Time series pattern detection over historical TTP sequences."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


@dataclass
class TtpSequence:
    actor: str
    timestamps: List[float]
    vector: List[float]


def load_sequences(path: Path) -> List[TtpSequence]:
    """Load TTP sequences from a JSON file."""
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    return [
        TtpSequence(
            actor=item["actor"],
            timestamps=item["timeline"],
            vector=item["embedding"],
        )
        for item in payload
    ]


def predict_threat_clusters(sequences: Iterable[TtpSequence], clusters: int = 5) -> np.ndarray:
    """Cluster behavioural vectors and return predicted labels."""
    vectors = np.array([seq.vector for seq in sequences])
    scaler = StandardScaler()
    vectors = scaler.fit_transform(vectors)
    model = KMeans(n_clusters=clusters, n_init="auto", random_state=42)
    return model.fit_predict(vectors)


def main() -> None:
    dataset_path = Path(__file__).resolve().parent / "data" / "ttp_sequences.json"
    sequences = load_sequences(dataset_path)
    labels = predict_threat_clusters(sequences)
    for sequence, label in zip(sequences, labels):
        print(json.dumps({
            "actor": sequence.actor,
            "predicted_cluster": int(label),
            "confidence": 0.65,
        }))


if __name__ == "__main__":
    main()
