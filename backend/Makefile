# Variables
PYTHON = python3
GRPC_PORT = 50051

install:
	uv pip install -r requirements.txt

fill:
	uv pip freeze > requirements.txt

lint:
	ruff check . --fix --unsafe-fixes --exclude venv 

format:
	ruff format . --exclude venv

check: format lint test

clean:
	rm -rf __pycache__ grpc/*.pyc grpc/*_pb2.py grpc/*_pb2_grpc.py

syncing:
	rsync -avz --exclude='venv/' ./ automl@112.137.129.161:/home/automl/click-tracking/backend/ && \
	ssh automl@112.137.129.161 'cd /home/automl/click-tracking/backend && \
	source venv/bin/activate && \
	pip install -r requirements.txt && \
	tmux send-keys -t 1 C-c Enter; tmux send-keys -t 1 "python3 consumer.py" Enter'

# Default target
.DEFAULT_GOAL := help
help:
	@echo "Available commands:"
	@echo "  install      - Install dependencies"
	@echo "  fill 		  - Fill the requirements.txt		
	@echo "  test         - Run tests"
	@echo "  format       - Format code using black"
	@echo "  lint         - Lint code using flake8"
	@echo "  check        - Run format, lint, and test"
	@echo "  clean        - Remove compiled Python files"
