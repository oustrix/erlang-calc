package erlang

import (
	"errors"
	"math"
)

var (
	ErrInvalidServers     = errors.New("количество операторов должно быть больше нуля")
	ErrInvalidOfferedLoad = errors.New("предлагаемая нагрузка должна быть конечным числом")
	ErrNegativeOffered    = errors.New("предлагаемая нагрузка не может быть отрицательной")
)

// MetricsRequest описывает входные данные для расчета моделей Эрланг B и C.
type MetricsRequest struct {
	OfferedLoad float64 `json:"offeredLoad"`
	Servers     int     `json:"servers"`
}

// MetricsResponse содержит агрегированные результаты расчетов Эрланг B и C.
type MetricsResponse struct {
	OfferedLoad          float64 `json:"offeredLoad"`
	Servers              int     `json:"servers"`
	Utilization          float64 `json:"utilization"`
	BlockingProbability  float64 `json:"blockingProbability"`
	WaitingProbability   float64 `json:"waitingProbability"`
	TrafficCarried       float64 `json:"trafficCarried"`
	EffectiveUtilization float64 `json:"effectiveUtilization"`
}

// CalculateMetrics вычисляет вероятности по формулам Эрланг B и Эрланг C.
func CalculateMetrics(req MetricsRequest) (MetricsResponse, error) {
	if err := validate(req); err != nil {
		return MetricsResponse{}, err
	}

	blocking := erlangB(req.OfferedLoad, req.Servers)
	waiting := erlangC(req.OfferedLoad, req.Servers, blocking)

	utilization := req.OfferedLoad / float64(req.Servers)
	if req.OfferedLoad == 0 {
		utilization = 0
	}

	trafficCarried := req.OfferedLoad * (1 - blocking)
	effectiveUtilization := 0.0
	if req.OfferedLoad > 0 {
		effectiveUtilization = trafficCarried / float64(req.Servers)
	}

	return MetricsResponse{
		OfferedLoad:          req.OfferedLoad,
		Servers:              req.Servers,
		Utilization:          clamp(utilization, 0, 1),
		BlockingProbability:  blocking,
		WaitingProbability:   waiting,
		TrafficCarried:       trafficCarried,
		EffectiveUtilization: clamp(effectiveUtilization, 0, 1),
	}, nil
}

func validate(req MetricsRequest) error {
	switch {
	case req.Servers <= 0:
		return ErrInvalidServers
	case math.IsNaN(req.OfferedLoad), math.IsInf(req.OfferedLoad, 0):
		return ErrInvalidOfferedLoad
	case req.OfferedLoad < 0:
		return ErrNegativeOffered
	default:
		return nil
	}
}

func erlangB(offeredLoad float64, servers int) float64 {
	if offeredLoad == 0 {
		return 0
	}
	b := 1.0
	for i := 1; i <= servers; i++ {
		b = (offeredLoad * b) / (float64(i) + offeredLoad*b)
	}
	return clamp(b, 0, 1)
}

func erlangC(offeredLoad float64, servers int, blocking float64) float64 {
	if offeredLoad == 0 {
		return 0
	}

	if float64(servers) <= offeredLoad {
		return 1
	}

	denominator := float64(servers) - offeredLoad*(1-blocking)
	if denominator <= 0 {
		return 1
	}

	numerator := blocking * float64(servers)
	return clamp(numerator/denominator, 0, 1)
}

func clamp(v, min, max float64) float64 {
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}
