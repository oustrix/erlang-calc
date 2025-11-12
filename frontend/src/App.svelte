<script lang="ts">
  import type { erlang } from '../wailsjs/go/models'
  import { CalculateMetrics } from '../wailsjs/go/main/App'

  type FormState = {
    offeredLoad: string
    servers: string
  }

  let form: FormState = {
    offeredLoad: '12.5',
    servers: '18'
  }

  let result: erlang.MetricsResponse | null = null
  let errorMessage = ''
  let isLoading = false

  const numberFormatter = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0
  })

  const percentFormatter = new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    maximumFractionDigits: 2
  })

  async function handleSubmit() {
    errorMessage = ''

    const offeredLoad = Number.parseFloat(form.offeredLoad)
    const servers = Number.parseInt(form.servers, 10)

    if (Number.isNaN(offeredLoad) || offeredLoad < 0) {
      errorMessage = 'Нагрузка должна быть неотрицательным числом.'
      result = null
      return
    }

    if (!Number.isFinite(offeredLoad)) {
      errorMessage = 'Нагрузка должна быть конечным числом.'
      result = null
      return
    }

    if (!Number.isInteger(servers) || servers <= 0) {
      errorMessage = 'Количество операторов должно быть положительным целым числом.'
      result = null
      return
    }

    isLoading = true
    try {
      result = await CalculateMetrics({
        offeredLoad,
        servers
      })
    } catch (error) {
      console.error(error)
      errorMessage = error instanceof Error ? error.message : 'Не удалось выполнить расчёт.'
      result = null
    } finally {
      isLoading = false
    }
  }
</script>

<main class="app">
  <header class="app__header">
    <h1 class="app__title">Калькулятор Эрланга</h1>
    <p class="app__subtitle">
      Инструмент для расчёта вероятностей Эрланг B (блокировка) и Эрланг C (ожидание) при заданной нагрузке и числе
      операторов.
    </p>
  </header>

  <section class="panel">
    <form class="form" on:submit|preventDefault={handleSubmit}>
      <div class="form__group">
        <label class="form__label" for="offeredLoad">Нагрузка, эрланг</label>
        <input
          id="offeredLoad"
          class="input"
          type="number"
          step="0.01"
          min="0"
          bind:value={form.offeredLoad}
          placeholder="Например, 12.5"
        />
        <p class="form__hint">Предлагаемая нагрузка в эрлангах. Рассчитывается как &lambda; × среднее время обслуживания.</p>
      </div>

      <div class="form__group">
        <label class="form__label" for="servers">Количество операторов</label>
        <input
          id="servers"
          class="input"
          type="number"
          min="1"
          step="1"
          bind:value={form.servers}
          placeholder="Например, 18"
        />
      </div>

      {#if errorMessage}
        <div class="alert alert--error">
          {errorMessage}
        </div>
      {/if}

      <button class="button" type="submit" disabled={isLoading}>
        {#if isLoading}
          Расчёт…
        {:else}
          Рассчитать
        {/if}
      </button>
    </form>
  </section>

  {#if result}
    <section class="panel">
      <h2 class="panel__title">Результаты</h2>
      <div class="metrics">
        <div class="metric">
          <div class="metric__label">Вероятность блокировки (Эрланг B)</div>
          <div class="metric__value">{percentFormatter.format(result.blockingProbability)}</div>
        </div>

        <div class="metric">
          <div class="metric__label">Вероятность ожидания (Эрланг C)</div>
          <div class="metric__value">{percentFormatter.format(result.waitingProbability)}</div>
        </div>

        <div class="metric">
          <div class="metric__label">Использование операторов</div>
          <div class="metric__value">{percentFormatter.format(result.utilization)}</div>
          <div class="metric__hint">
            При учёте отказов: {percentFormatter.format(result.effectiveUtilization)}
          </div>
        </div>

        <div class="metric">
          <div class="metric__label">Принятая нагрузка</div>
          <div class="metric__value">{numberFormatter.format(result.trafficCarried)} эрл.</div>
          <div class="metric__hint">
            Предлагаемая нагрузка: {numberFormatter.format(result.offeredLoad)} эрл., операторов: {result.servers}
          </div>
        </div>
      </div>
    </section>
  {/if}
</main>

<style>
  .app {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: min(900px, 100%);
    margin: 0 auto;
    padding: 3rem 1.5rem 4rem;
  }

  .app__header {
    text-align: center;
  }

  .app__title {
    margin: 0;
    font-size: clamp(2rem, 3vw, 2.5rem);
    font-weight: 600;
  }

  .app__subtitle {
    margin: 0.5rem 0 0;
    color: #4b5563;
  }

  .panel {
    background: #ffffff;
    border-radius: 16px;
    padding: 2rem;
    box-shadow:
      0 12px 32px -16px rgba(15, 23, 42, 0.35),
      0 4px 12px -6px rgba(15, 23, 42, 0.2);
  }

  .panel__title {
    margin: 0 0 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form__group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form__label {
    font-weight: 600;
    color: #111827;
  }

  .form__hint {
    margin: 0;
    font-size: 0.85rem;
    color: #6b7280;
  }

  .input {
    padding: 0.75rem 1rem;
    border-radius: 12px;
    border: 1px solid #d1d5db;
    font-size: 1rem;
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }

  .input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
  }

  .alert {
    border-radius: 12px;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
  }

  .alert--error {
    border: 1px solid rgba(220, 38, 38, 0.15);
    background: rgba(254, 226, 226, 0.7);
    color: #991b1b;
  }

  .button {
    align-self: flex-start;
    padding: 0.75rem 1.5rem;
    border-radius: 999px;
    border: none;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: #fff;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;
  }

  .button:disabled {
    cursor: wait;
    opacity: 0.75;
    filter: grayscale(0.2);
  }

  .button:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 20px -15px rgba(37, 99, 235, 0.8);
  }

  .metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
  }

  .metric {
    background: #f9fafb;
    border-radius: 14px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .metric__label {
    font-size: 0.95rem;
    color: #4b5563;
    font-weight: 600;
  }

  .metric__value {
    font-size: 1.65rem;
    font-weight: 700;
    color: #111827;
  }

  .metric__hint {
    font-size: 0.85rem;
    color: #6b7280;
  }

  @media (max-width: 640px) {
    .app {
      padding-top: 2rem;
    }

    .panel {
      padding: 1.5rem;
    }
  }
</style>
