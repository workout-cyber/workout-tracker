let workouts = JSON.parse(localStorage.getItem("workouts")) || [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || ["Bench Press", "Squat", "Deadlift"];
let darkMode = localStorage.getItem("darkMode") === "true";

let volumeChart = null;
let prChart = null;

if (darkMode) document.body.classList.add("dark");

window.onload = () => {
    renderWorkouts();
    renderFavorites();
    updateVolume();
    updatePRs();
    drawVolumeChart();
    drawPRChart();
    updateComparison();
    renderCalendar();
};

function addWorkout() {
    const exerciseInput = document.getElementById("exercise");
    const repsInput = document.getElementById("reps");
    const weightInput = document.getElementById("weight");

    let exercise = exerciseInput.value.trim();
    let reps = repsInput.value;
    let weight = weightInput.value;

    if (!exercise || !reps || !weight) return;

    let entry = {
        exercise,
        reps: Number(reps),
        weight: Number(weight),
        date: new Date().toLocaleDateString() // Keep date format consistent
    };

    workouts.push(entry);
    localStorage.setItem("workouts", JSON.stringify(workouts));

    renderWorkouts(true, entry);
    updateVolume();
    updatePRs(entry);
    drawVolumeChart();
    drawPRChart();
    updateComparison();
    renderCalendar();

    // Reset inputs smoothly
    repsInput.value = "";
    weightInput.value = "";
}

function renderWorkouts(highlight = false, newEntry = null) {
    let log = document.getElementById("log");
    log.innerHTML = "";

    // Reverse array slice to show newest entries at the very top of your log
    workouts.slice().reverse().forEach((w) => {
        let originalIndex = workouts.indexOf(w);
        let li = document.createElement("li");

        let span = document.createElement("span");
        span.textContent = `${w.exercise} - ${w.reps} reps @ ${w.weight} lbs (${w.date})`;

        let btn = document.createElement("button");
        btn.className = "delete-btn";
        btn.setAttribute("aria-label", "Delete workout entry");
        btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
                <path d="M9 6V4h6v2"></path>
            </svg>
        `;
        btn.onclick = () => deleteWorkout(originalIndex);

        li.appendChild(span);
        li.appendChild(btn);

        if (highlight && newEntry && w === newEntry) {
            li.classList.add("new-pr");
        }

        log.appendChild(li);
    });
}

function deleteWorkout(index) {
    workouts.splice(index, 1);
    localStorage.setItem("workouts", JSON.stringify(workouts));
    renderWorkouts();
    updateVolume();
    updatePRs();
    drawVolumeChart();
    drawPRChart();
    updateComparison();
    renderCalendar();
}

function updateVolume() {
    let total = workouts.reduce((sum, w) => sum + (w.reps * w.weight), 0);
    document.getElementById("totalVolume").textContent = total.toLocaleString();
}

function renderFavorites() {
    let bar = document.getElementById("favBar");
    bar.innerHTML = "";

    favorites.forEach(ex => {
        let btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = ex;
        btn.onclick = () => {
            document.getElementById("exercise").value = ex;
        };
        bar.appendChild(btn);
    });
}

function updatePRs(newEntry = null) {
    let prs = {};
    workouts.forEach(w => {
        if (!prs[w.exercise] || w.weight > prs[w.exercise]) {
            prs[w.exercise] = w.weight;
        }
    });

    localStorage.setItem("prs", JSON.stringify(prs));

    let prList = document.getElementById("prList");
    prList.innerHTML = "";

    for (let ex in prs) {
        let li = document.createElement("li");
        let left = document.createElement("span");
        left.textContent = `${ex}: ${prs[ex]} lbs`;

        let badge = document.createElement("span");
        badge.classList.add("badge");

        // Polished absolute standard performance badges
        if (prs[ex] >= 405) badge.classList.add("badge-gold");
        else if (prs[ex] >= 225) badge.classList.add("badge-silver");
        else badge.classList.add("badge-bronze");

        badge.textContent = "PR";

        li.appendChild(left);
        li.appendChild(badge);

        if (newEntry && newEntry.exercise === ex && newEntry.weight === prs[ex]) {
            li.classList.add("new-pr");
        }

        prList.appendChild(li);
    }
}

function drawVolumeChart() {
    let ctx = document.getElementById("chartVolume");
    if (!ctx) return;

    let daily = [0,0,0,0,0,0,0];
    
    // Calculate the start of the current week (Sunday)
    let today = new Date();
    let currentSunday = new Date(today.setDate(today.getDate() - today.getDay()));
    currentSunday.setHours(0,0,0,0);

    workouts.forEach(w => {
        let d = new Date(w.date);
        // Ensure we only chart workouts logged during the active 7-day calendar week
        if (!isNaN(d) && d >= currentSunday) {
            daily[d.getDay()] += w.reps * w.weight;
        }
    });

    if (volumeChart) volumeChart.destroy();

    let textColor = darkMode ? "#f5f5f5" : "#222222";
    let gridColor = darkMode ? "#333333" : "#e5e7eb";

    volumeChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
            datasets: [{
                label: "Volume (lbs)",
                data: daily,
                backgroundColor: "#007aff",
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
                x: { grid: { color: gridColor }, ticks: { color: textColor } }
            },
            plugins: { legend: { labels: { color: textColor } } }
        }
    });
}

function drawPRChart() {
    let ctx = document.getElementById("chartPR");
    if (!ctx) return;

    let prs = JSON.parse(localStorage.getItem("prs")) || {};
    let labels = Object.keys(prs);
    let data = Object.values(prs);

    if (prChart) prChart.destroy();

    let textColor = darkMode ? "#f5f5f5" : "#222222";
    let gridColor = darkMode ? "#333333" : "#e5e7eb";

    prChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "PR (lbs)",
                data,
                backgroundColor: "#34c759",
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            scales: {
                x: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
                y: { grid: { color: gridColor }, ticks: { color: textColor } }
            },
            plugins: { legend: { labels: { color: textColor } } }
        }
    });
}

function updateComparison() {
    let compText = document.getElementById("comparisonText");
    if (workouts.length === 0) {
        compText.textContent = "";
        return;
    }

    let todayStr = new Date().toLocaleDateString();
    let lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    let lastWeekStr = lastWeek.toLocaleDateString();

    let todayVol = workouts
        .filter(w => w.date === todayStr)
        .reduce((s, w) => s + w.reps * w.weight, 0);

    let lastWeekVol = workouts
        .filter(w => w.date === lastWeekStr)
        .reduce((s, w) => s + w.re7ps * w.weight, 0); // Typo check: ensure clean variables

    if (todayVol === 0 && lastWeekVol === 0) {
        compText.textContent = "No volume registered for today or this day last week.";
        return;
    }

    let diff = todayVol - lastWeekVol;
    let msg = `Today: ${todayVol} lbs vs same day last week: ${lastWeekVol} lbs.`;

    if (diff > 0) msg += ` (+${diff} lbs 🔥)`;
    else if (diff < 0) msg += ` (${diff} lbs)`;
    else msg += ` (Exactly matching volume 💪)`;

    compText.textContent = msg;
}

function renderCalendar() {
    let cal = document.getElementById("calendar");
    cal.innerHTML = "";

    let byDate = {};
    workouts.forEach(w => {
        if (!byDate[w.date]) byDate[w.date] = [];
        byDate[w.date].push(w);
    });

    let dates = Object.keys(byDate).sort((a,b) => new Date(b) - new Date(a));

    dates.forEach(date => {
        let dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day";

        let title = document.createElement("div");
        title.className = "calendar-day-title";
        title.textContent = date;

        dayDiv.appendChild(title);

        byDate[date].forEach(w => {
            let entry = document.createElement("div");
            entry.className = "calendar-entry";
            entry.textContent = `${w.exercise} - ${w.reps} reps @ ${w.weight} lbs`;
            dayDiv.appendChild(entry);
        });

        cal.appendChild(dayDiv);
    });
}

document.getElementById("darkToggle").onclick = () => {
    document.body.classList.toggle("dark");
    darkMode = !darkMode;
    localStorage.setItem("darkMode", darkMode);
    
    // Swaps the emoji icon fluidly
    document.getElementById("darkToggle").textContent = darkMode ? "☀️" : "🌙";
    
    // Force charts to re-render using updated light/dark variable values
    drawVolumeChart();
    drawPRChart();
};