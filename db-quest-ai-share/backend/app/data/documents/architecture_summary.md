# Architecture Summary

- The platform uses a Python FastAPI backend and a React frontend.
- Data is stored in structured JSON and markdown documents for the hackathon demo.
- The retrieval layer uses TF-IDF chunks so it can later be replaced with a vector database.
- Security controls include MFA, secure file transfer, and verified review steps.

The architecture is designed for fast iteration, clear explainability, and offline demo readiness.
