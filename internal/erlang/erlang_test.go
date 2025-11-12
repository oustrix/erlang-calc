package erlang_test

import (
	"erlang-calc/internal/erlang"
	"math"
	"testing"

	"github.com/stretchr/testify/require"
)

const tol = 1e-9

func TestCalculateMetrics(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		req  erlang.MetricsRequest
		want erlang.MetricsResponse
	}{
		{
			name: "typical load under capacity",
			req:  erlang.MetricsRequest{OfferedLoad: 2.5, Servers: 3},
			want: erlang.MetricsResponse{
				OfferedLoad:          2.5,
				Servers:              3,
				BlockingProbability:  0.28216704288939054,
				WaitingProbability:   0.702247191011236,
				Utilization:          0.8333333333333334,
				TrafficCarried:       1.7945823927765236,
				EffectiveUtilization: 0.5981941309255079,
			},
		},
		{
			name: "zero load clears metrics",
			req:  erlang.MetricsRequest{OfferedLoad: 0, Servers: 5},
			want: erlang.MetricsResponse{
				OfferedLoad:          0,
				Servers:              5,
				BlockingProbability:  0,
				WaitingProbability:   0,
				Utilization:          0,
				TrafficCarried:       0,
				EffectiveUtilization: 0,
			},
		},
		{
			name: "load equals capacity forces waiting",
			req:  erlang.MetricsRequest{OfferedLoad: 3, Servers: 3},
			want: erlang.MetricsResponse{
				OfferedLoad:          3,
				Servers:              3,
				BlockingProbability:  0.3461538461538462,
				WaitingProbability:   1,
				Utilization:          1,
				TrafficCarried:       1.9615384615384612,
				EffectiveUtilization: 0.6538461538461537,
			},
		},
		{
			name: "overloaded system clamps utilization",
			req:  erlang.MetricsRequest{OfferedLoad: 4.5, Servers: 3},
			want: erlang.MetricsResponse{
				OfferedLoad:          4.5,
				Servers:              3,
				BlockingProbability:  0.49290060851926976,
				WaitingProbability:   1,
				Utilization:          1,
				TrafficCarried:       2.2819472616632863,
				EffectiveUtilization: 0.7606490872210955,
			},
		},
		{
			name: "high load remains stable",
			req:  erlang.MetricsRequest{OfferedLoad: 7.25, Servers: 10},
			want: erlang.MetricsResponse{
				OfferedLoad:          7.25,
				Servers:              10,
				BlockingProbability:  0.08894584194490221,
				WaitingProbability:   0.2620017063087123,
				Utilization:          0.725,
				TrafficCarried:       6.605142645899459,
				EffectiveUtilization: 0.6605142645899459,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			got, err := erlang.CalculateMetrics(tt.req)
			require.NoError(t, err)
			require.Equal(t, got.Servers, tt.want.Servers)
			require.InDelta(t, got.OfferedLoad, tt.want.OfferedLoad, tol)
			require.InDelta(t, got.BlockingProbability, tt.want.BlockingProbability, tol)
			require.InDelta(t, got.WaitingProbability, tt.want.WaitingProbability, tol)
			require.InDelta(t, got.Utilization, tt.want.Utilization, tol)
			require.InDelta(t, got.TrafficCarried, tt.want.TrafficCarried, tol)
			require.InDelta(t, got.EffectiveUtilization, tt.want.EffectiveUtilization, tol)
		})
	}
}

func TestCalculateMetricsValidation(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		req  erlang.MetricsRequest
		want error
	}{
		{
			name: "negative load",
			req:  erlang.MetricsRequest{OfferedLoad: -1, Servers: 1},
			want: erlang.ErrNegativeOffered,
		},
		{
			name: "zero servers",
			req:  erlang.MetricsRequest{OfferedLoad: 1, Servers: 0},
			want: erlang.ErrInvalidServers,
		},
		{
			name: "negative servers",
			req:  erlang.MetricsRequest{OfferedLoad: 1.2, Servers: -3},
			want: erlang.ErrInvalidServers,
		},
		{
			name: "NaN load",
			req:  erlang.MetricsRequest{OfferedLoad: math.NaN(), Servers: 2},
			want: erlang.ErrInvalidOfferedLoad,
		},
		{
			name: "infinite load",
			req:  erlang.MetricsRequest{OfferedLoad: math.Inf(1), Servers: 2},
			want: erlang.ErrInvalidOfferedLoad,
		},
		{
			name: "negative infinite load",
			req:  erlang.MetricsRequest{OfferedLoad: math.Inf(-1), Servers: 2},
			want: erlang.ErrInvalidOfferedLoad,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			_, err := erlang.CalculateMetrics(tt.req)
			require.ErrorIs(t, err, tt.want)
		})
	}
}
