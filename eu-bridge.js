(()=> {
  const BRIDGE_KEY = 'eu_bridge_traco_v1';

  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const dayKey = (value) => {
    const date = new Date(value);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  };

  const startOfWeek = () => {
    const date = new Date();
    const diff = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  };

  const streak = (sessions) => {
    const days = [...new Set(
      sessions
        .filter((session) => session?.finishedAt)
        .map((session) => dayKey(session.startedAt || session.finishedAt))
    )].sort().reverse();

    if (!days.length) return 0;

    let current = new Date();
    current.setHours(0, 0, 0, 0);

    const today = dayKey(current.getTime());
    if (days[0] !== today) {
      current.setDate(current.getDate() - 1);
      if (days[0] !== dayKey(current.getTime())) return 0;
    }

    let count = 0;
    for (const key of days) {
      if (key !== dayKey(current.getTime())) break;
      count += 1;
      current.setDate(current.getDate() - 1);
    }
    return count;
  };

  const publish = () => {
    const sessions = read('v60_sessions', []).filter((session) => session?.finishedAt);
    const profile = read('v60_profile', { weeklyGoal: 5 });
    const weekStart = startOfWeek();
    const week = sessions.filter((session) => Number(session.startedAt || 0) >= weekStart);
    const cardioMinutes = week.reduce((sum, session) => {
      return sum + (session.extras || [])
        .filter((item) => item?.type === 'cardio')
        .reduce((subtotal, item) => subtotal + Number(item.minutes || 0), 0);
    }, 0);
    const prCount = sessions.reduce(
      (sum, session) => sum + (Array.isArray(session.prs) ? session.prs.length : 0),
      0
    );
    const goal = Math.max(1, Number(profile.weeklyGoal) || 5);
    const latest = sessions
      .slice()
      .sort((a, b) => Number(b.finishedAt || 0) - Number(a.finishedAt || 0))[0];

    const phase = read('traco_shape_phase_v1', null);
    const bodyRows = read('v60_body', []).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    const latestBody = bodyRows[0] || {};
    const experiments = read('traco_experiments_v1', []);
    const activeExperiment = experiments.find((item) => !item?.finishedAt) || null;
    const evolutionDaily = read('traco_evolution_daily_v1', {});
    const todayEvolution = evolutionDaily[dayKey(Date.now())] || {};
    const recommendation = typeof window.TracoEvolution?.smartWorkout === 'function'
      ? window.TracoEvolution.smartWorkout()
      : null;
    const readiness = typeof window.TracoLab?.readiness === 'function'
      ? window.TracoLab.readiness()
      : null;

    const payload = {
      version: 1,
      app: 'traco',
      title: 'Traço',
      updatedAt: new Date().toISOString(),
      status: week.length >= goal ? 'meta batida' : 'em progresso',
      summary: [
        phase?.name ? 'fase ' + phase.name : null,
        `${week.length}/${goal} treinos na semana`,
        recommendation?.short ? 'próximo ' + recommendation.short : null
      ].filter(Boolean).join(' · '),
      metrics: {
        workoutsThisWeek: week.length,
        weeklyGoal: goal,
        totalWorkouts: sessions.length,
        streakDays: streak(sessions),
        cardioMinutesThisWeek: cardioMinutes,
        totalPrs: prCount,
        lastWorkoutAt: latest?.finishedAt || null,
        shapePhase: phase?.name || null,
        activeExperiment: activeExperiment?.name || null,
        nextWorkout: recommendation?.short || null,
        readinessScore: readiness?.score ?? null,
        waistCm: Number(latestBody?.waist || 0) || null,
        shouldersCm: Number(latestBody?.shoulders || 0) || null,
        chestCm: Number(latestBody?.chest || 0) || null,
        bodyFeeling: Array.isArray(todayEvolution?.feelings) ? todayEvolution.feelings.join(', ') : null
      }
    };

    localStorage.setItem(BRIDGE_KEY, JSON.stringify(payload));
  };

  window.addEventListener('load', publish);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) publish();
  });
  setInterval(publish, 5000);
  window.euBridgeRefresh = publish;
})();
