BACKEND_DIR := backend
FRONTEND_DIR := frontend

.PHONY: install backend frontend dev test

install:
	cd $(BACKEND_DIR) && npm install

backend:
	cd $(BACKEND_DIR) && PORT=8000 npm start

frontend:
	python3 -m http.server 3000 --directory $(FRONTEND_DIR)

dev:
	@echo "Starting backend on port 8000 and frontend on port 3000..."
	@(cd $(BACKEND_DIR) && PORT=8000 npm start) & \
	(cd $(FRONTEND_DIR) && python3 -m http.server 3000)

test:
	cd $(BACKEND_DIR) && npm test
