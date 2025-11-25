// Математические функции

function erlang_b(a, v) {
    // Устойчивое вычисление Erlang B
    if (a < 0 || v < 0) {
        throw new Error("a и v должны быть неотрицательны");
    }
    let B = 1.0;
    for (let i = 1; i <= v; i++) {
        B = (a * B) / (i + a * B);
    }
    return B;
}

function inverse_erlang_b(v, target_B, tol = 1e-10, max_iter = 200) {
    // По v и B найти a (метод бисекции). Возвращает a >= 0
    if (!(0 <= target_B && target_B < 1)) {
        throw new Error("B должно быть в диапазоне [0,1).");
    }
    let lo = 1e-12;
    let hi = 1.0;
    
    // Найдём hi, который даёт B(hi) < target_B
    for (let i = 0; i < 1000; i++) {
        const B_hi = erlang_b(hi, v);
        if (B_hi <= target_B) {
            break;
        }
        hi *= 2.0;
        if (hi > 1e12) {
            break;
        }
    }
    
    // бисекция
    for (let i = 0; i < max_iter; i++) {
        const mid = 0.5 * (lo + hi);
        const B_mid = erlang_b(mid, v);
        if (Math.abs(B_mid - target_B) < tol) {
            return mid;
        }
        if (B_mid > target_B) {
            hi = mid;
        } else {
            lo = mid;
        }
    }
    return 0.5 * (lo + hi);
}

function find_v_for_B(a, target_B, v_max = 1000) {
    // Минимальное целое v такое, что B(v,a) <= target_B
    if (a < 0) {
        throw new Error("a должно быть >= 0");
    }
    if (!(0 <= target_B && target_B < 1)) {
        throw new Error("B должно быть в [0,1)");
    }
    for (let v = 1; v <= v_max; v++) {
        if (erlang_b(a, v) <= target_B) {
            return v;
        }
    }
    throw new Error("Не найдено v в пределах v_max");
}

// UI логика

class ErlangBApp {
    constructor() {
        this.v_active = document.getElementById('v_active');
        this.a_active = document.getElementById('a_active');
        this.b_active = document.getElementById('b_active');
        this.m_active = document.getElementById('m_active');
        
        this.entry_v = document.getElementById('entry_v');
        this.entry_a = document.getElementById('entry_a');
        this.entry_b = document.getElementById('entry_b');
        this.entry_m = document.getElementById('entry_m');
        
        this.results_tbody = document.getElementById('results_tbody');
        
        this.setDefaults();
        this.updateState();
        
        // Обработчики событий
        this.v_active.addEventListener('change', () => this.updateState());
        this.a_active.addEventListener('change', () => this.updateState());
        this.b_active.addEventListener('change', () => this.updateState());
        this.m_active.addEventListener('change', () => this.updateState());
        
        document.getElementById('btn_reset').addEventListener('click', () => this.reset());
        document.getElementById('btn_calculate').addEventListener('click', () => this.calculate());
    }
    
    setDefaults() {
        this.entry_v.value = "3";
        this.entry_a.value = "0.65";
        this.entry_b.value = "";
        this.entry_m.value = "";
        this.updateState();
    }
    
    updateState() {
        this.entry_v.disabled = !this.v_active.checked;
        this.entry_a.disabled = !this.a_active.checked;
        this.entry_b.disabled = !this.b_active.checked;
        this.entry_m.disabled = !this.m_active.checked;
    }
    
    reset() {
        this.entry_v.disabled = false;
        this.entry_a.disabled = false;
        this.entry_b.disabled = false;
        this.entry_m.disabled = false;
        
        this.entry_v.value = "";
        this.entry_a.value = "";
        this.entry_b.value = "";
        this.entry_m.value = "";
        
        this.results_tbody.innerHTML = '<div class="empty-results">Результаты расчетов появятся здесь</div>';
        this.setDefaults();
    }
    
    validateBasic(v, a, b, m) {
        // Проверки диапазонов и логики
        if (v !== null) {
            if (v < 1) {
                throw new Error("Число каналов v должно быть целым >= 1.");
            }
        }
        if (a !== null) {
            if (a < 0) {
                throw new Error("Интенсивность a должна быть >= 0.");
            }
        }
        if (b !== null) {
            if (!(0 <= b && b < 1)) {
                throw new Error("Доля потерь B должна быть в промежутке [0, 1).");
            }
        }
        if (m !== null) {
            if (m < 0) {
                throw new Error("Среднее число занятых каналов m должно быть >= 0.");
            }
        }
        if (v !== null && m !== null) {
            if (m >= v - 1e-12) {
                throw new Error("Среднее число занятых каналов m должно быть строго меньше числа каналов v.");
            }
        }
    }
    
    calculate() {
        const active = [];
        if (this.v_active.checked) active.push("v");
        if (this.a_active.checked) active.push("a");
        if (this.b_active.checked) active.push("b");
        if (this.m_active.checked) active.push("m");
        
        if (active.length !== 2) {
            alert("Ошибка: Выберите ровно два активных параметра для расчёта.");
            return;
        }
        
        // прочитать введённое
        let v, a, b, m;
        
        try {
            v = (this.v_active.checked && this.entry_v.value.trim() !== "") 
                ? parseInt(this.entry_v.value) : null;
        } catch (e) {
            alert("Ошибка: Поле 'Число каналов' должно быть целым.");
            return;
        }
        
        try {
            a = (this.a_active.checked && this.entry_a.value.trim() !== "") 
                ? parseFloat(this.entry_a.value.replace(",", ".")) : null;
            b = (this.b_active.checked && this.entry_b.value.trim() !== "") 
                ? parseFloat(this.entry_b.value.replace(",", ".")) : null;
            m = (this.m_active.checked && this.entry_m.value.trim() !== "") 
                ? parseFloat(this.entry_m.value.replace(",", ".")) : null;
        } catch (e) {
            alert("Ошибка: Неверный формат чисел (a, B или m).");
            return;
        }
        
        try {
            this.validateBasic(v, a, b, m);
        } catch (e) {
            alert("Ошибка проверки входа: " + e.message);
            return;
        }
        
        try {
            let B, M;
            const activeSet = new Set(active);
            
            // Обрабатываем возможные комбинации
            if (activeSet.has("v") && activeSet.has("a")) {
                // считаем B и m
                B = erlang_b(a, v);
                M = a * (1 - B);
            } else if (activeSet.has("v") && activeSet.has("b")) {
                // ищем a по v и B
                a = inverse_erlang_b(v, b);
                B = b;
                M = a * (1 - B);
            } else if (activeSet.has("v") && activeSet.has("m")) {
                // по v и m ищем a
                const f_a = (a_val) => a_val * (1 - erlang_b(a_val, v)) - m;
                let lo = 1e-12;
                let hi = Math.max(1.0, m + 1.0);
                
                for (let i = 0; i < 200; i++) {
                    if (f_a(hi) >= 0) {
                        break;
                    }
                    hi *= 2.0;
                    if (hi > 1e12) {
                        break;
                    }
                }
                
                if (f_a(hi) < 0) {
                    throw new Error("Не удалось найти a, при котором достигается заданное среднее число занятых каналов (возможно m слишком велико).");
                }
                
                // бисекция
                for (let i = 0; i < 80; i++) {
                    const mid = 0.5 * (lo + hi);
                    if (f_a(mid) >= 0) {
                        hi = mid;
                    } else {
                        lo = mid;
                    }
                }
                a = 0.5 * (lo + hi);
                B = erlang_b(a, v);
                M = m;
            } else if (activeSet.has("a") && activeSet.has("b")) {
                // найти минимальное целое v, при котором B(v,a) <= b
                v = find_v_for_B(a, b, 2000);
                B = b;
                M = a * (1 - B);
            } else if (activeSet.has("a") && activeSet.has("m")) {
                // по a и m — найти минимальное целое v такое, что A_c(v) >= m
                if (m > a + 1e-12) {
                    throw new Error("Среднее число занятых каналов m не может превышать общий offered traffic a.");
                }
                let v_found = null;
                for (let vtest = 1; vtest <= 2000; vtest++) {
                    const Btest = erlang_b(a, vtest);
                    const Mtest = a * (1 - Btest);
                    if (Mtest + 1e-9 >= m) {
                        v_found = vtest;
                        break;
                    }
                }
                if (v_found === null) {
                    throw new Error("Не найдено v в пределах поиска (возможно m слишком велико).");
                }
                v = v_found;
                B = erlang_b(a, v);
                M = a * (1 - B);
            } else if (activeSet.has("b") && activeSet.has("m")) {
                // Ищем минимальное v и соответствующее a
                if (!(0 <= b && b < 1)) {
                    throw new Error("B должно быть в [0,1).");
                }
                if (b >= 1.0) {
                    throw new Error("B должно быть < 1.");
                }
                
                if (Math.abs(1.0 - b) < 1e-15) {
                    throw new Error("Неверные входные данные (1 - B слишком мало).");
                }
                const a_needed = m / (1.0 - b);
                
                let v_found = null;
                for (let vtest = 1; vtest <= 2000; vtest++) {
                    const Btest = erlang_b(a_needed, vtest);
                    if (Math.abs(Btest - b) <= Math.max(1e-6, 1e-4 * b)) {
                        v_found = vtest;
                        break;
                    }
                    if (Btest <= b) {
                        v_found = vtest;
                        break;
                    }
                }
                if (v_found === null) {
                    throw new Error("Не найдено подходящее число каналов v для заданных B и m.");
                }
                v = v_found;
                a = a_needed;
                B = erlang_b(a, v);
                M = a * (1 - B);
            } else {
                throw new Error("Эта комбинация параметров пока не поддерживается.");
            }
            
            // дополнительная проверка логики: m < v
            if (M >= v - 1e-12) {
                throw new Error("Результат: среднее число занятых каналов получился >= числа каналов — проверьте входные данные.");
            }
            
            // обновляем поля
            this.entry_v.disabled = false;
            this.entry_a.disabled = false;
            this.entry_b.disabled = false;
            this.entry_m.disabled = false;
            
            this.entry_v.value = String(Math.round(v));
            this.entry_a.value = a.toFixed(6);
            this.entry_b.value = B.toFixed(6);
            this.entry_m.value = M.toFixed(6);
            
            // удаляем пустое сообщение, если есть
            const emptyMsg = this.results_tbody.querySelector('.empty-results');
            if (emptyMsg) {
                emptyMsg.remove();
            }
            
            // создаем карточку результата
            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML = `
                <div class="result-row">
                    <span class="result-label">Каналы:</span>
                    <span class="result-value">${Math.round(v)}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Интенсивность:</span>
                    <span class="result-value">${a.toFixed(6)}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Потери:</span>
                    <span class="result-value">${B.toFixed(6)}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Занято:</span>
                    <span class="result-value">${M.toFixed(6)}</span>
                </div>
            `;
            
            // добавляем в начало списка (новые сверху)
            this.results_tbody.insertBefore(card, this.results_tbody.firstChild);
            
            // восстановим состояния
            this.updateState();
            
        } catch (e) {
            alert("Ошибка вычислений: " + e.message);
            return;
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new ErlangBApp();
});

