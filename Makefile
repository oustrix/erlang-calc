WAILS := go tool github.com/wailsapp/wails/v2/cmd/wails
SMARTIMPORTS := go tool github.com/pav5000/smartimports/cmd/smartimports

check:
	$(WAILS) doctor

.PHONY: build
build:
	$(WAILS) build

.PHONY: format
format:
	go fmt ./...
	$(SMARTIMPORTS) ./...