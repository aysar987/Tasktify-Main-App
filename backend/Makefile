.PHONY: dev build test tidy

dev:
	go run ./cmd/api

build:
	go build -o bin/tasktify-api ./cmd/api

test:
	go test ./...

tidy:
	go mod tidy
