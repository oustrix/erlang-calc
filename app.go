package main

import (
	"context"
	"erlang-calc/internal/erlang"
)

// App представляет приложение Wails.
type App struct {
	ctx context.Context
}

// NewApp создает новую структуру приложения.
func NewApp() *App {
	return &App{}
}

// startup вызывается при запуске приложения и сохраняет контекст Wails.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// CalculateMetrics возвращает показатели Эрланг B и Эрланг C для заданных параметров.
func (a *App) CalculateMetrics(req erlang.MetricsRequest) (erlang.MetricsResponse, error) {
	return erlang.CalculateMetrics(req)
}
