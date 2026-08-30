BACKEND_DIR := backend
FRONTEND_DIR := frontend

.PHONY: install install-backend install-frontend backend frontend dev test docker docker-down docker-test

install: install-backend install-frontend
	@echo "✓ Installation complete!"

install-backend:
	@echo "Installing backend dependencies..."
	cd $(BACKEND_DIR) && npm install

install-frontend:
	@echo "Checking frontend..."
	@if [ -d "$(FRONTEND_DIR)" ]; then \
		echo "✓ Frontend files ready (no dependencies needed)"; \
	else \
		echo "✗ Frontend directory not found"; \
		exit 1; \
	fi

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

docker:
	@echo "Starting Docker containers..."
	@docker-compose up

docker-down:
	@echo "Stopping Docker containers..."
	@docker-compose down

docker-test:
	@echo "Testing Docker configuration..."
	@./test-docker.sh
