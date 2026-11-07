// La famille: behaviour shared by the Barbès and Café Tati pages. Every page works without it.
// Preview any moment with ?at=<day 0-6>-<HH:MM>, for example ?at=5-20:30 for Friday at 8:30 pm.

// Opening hours in America/New_York as [opens, closes] in minutes after midnight; Sunday is 0.
// A close after midnight is written past 1440. Sources and conflicts: RESEARCH.md.
const H = (h, m = 0) => h * 60 + m;
const HOUSES = {
	tati: {
		name: "Café Tati",
		hours: { 0: [H(7), H(21)], 1: [H(7), H(21)], 2: [H(7), H(21)], 3: [H(7), H(21)], 4: [H(7), H(21)], 5: [H(7), H(21)], 6: [H(7), H(21)] },
	},
	barbes: {
		name: "Barbès",
		hours: { 0: [H(11), H(22)], 1: [H(16), H(22)], 2: [H(16), H(22)], 3: [H(16), H(22)], 4: [H(16), H(22)], 5: [H(16), H(24)], 6: [H(11), H(24)] },
	},
};
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function hobokenNow() {
	const at = new URLSearchParams(location.search).get("at");
	const match = at && at.match(/^([0-6])-(\d{1,2}):(\d{2})$/);
	if (match) return { day: Number(match[1]), minute: Number(match[2]) * 60 + Number(match[3]) };
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" })
			.formatToParts(new Date())
			.map((p) => [p.type, p.value]),
	);
	return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday), minute: Number(parts.hour) * 60 + Number(parts.minute) };
}

function formatTime(minute) {
	if (minute % 1440 === 0) return "midnight";
	const h = Math.floor(minute / 60) % 24;
	const m = minute % 60;
	const h12 = h % 12 || 12;
	return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h >= 12 ? "pm" : "am"}`;
}

// Where a house stands right now. A Friday close at midnight still counts as open at 11:50 pm Friday.
function stateOf(key, now) {
	const hours = HOUSES[key].hours;
	const [opens, closes] = hours[now.day];
	const [, prevCloses] = hours[(now.day + 6) % 7];
	if (prevCloses > 1440 && now.minute < prevCloses - 1440) return { open: true, closes: prevCloses - 1440 };
	if (now.minute >= opens && now.minute < closes) return { open: true, closes };
	if (now.minute < opens) return { open: false, opensToday: true, opens };
	return { open: false, opensToday: false, opens: hours[(now.day + 1) % 7][0] };
}

function statusText(key, now) {
	const s = stateOf(key, now);
	if (s.open) return s.closes - now.minute <= 45 && s.closes - now.minute > 0 ? `Open now · closing at ${formatTime(s.closes)}` : `Open now · until ${formatTime(s.closes)}`;
	return s.opensToday ? `Closed · opens today at ${formatTime(s.opens)}` : `Closed · opens tomorrow at ${formatTime(s.opens)}`;
}

// The hand-off line: each house recommends the other at the right moment.
const RELAY = {
	// Shown on the Barbès site, about Café Tati.
	tati(now) {
		const tati = stateOf("tati", now);
		const barbes = stateOf("barbes", now);
		if (tati.open && !barbes.open) return `Barbès opens at ${formatTime(barbes.opens)}. Until then, our little sister Café Tati is pouring on 4th & Bloomfield until ${formatTime(tati.closes)}.`;
		if (tati.open) return `Café Tati is open now until ${formatTime(tati.closes)}: coffee, crêpes and a BYOB dinner, about fifteen minutes’ walk downtown.`;
		return `Tomorrow starts at Café Tati: doors open at ${formatTime(tati.opens)} for espresso and warm croissants.`;
	},
	// Shown on the Café Tati site, about Barbès.
	barbes(now) {
		const barbes = stateOf("barbes", now);
		const music = now.day === 5 || now.day === 6;
		if (barbes.open) return `Barbès is open now until ${formatTime(barbes.closes)}${music ? ", with live music tonight" : ""}. Tagines, cocktails and the zinc bar, up on 13th & Park.`;
		if (barbes.opensToday && barbes.opens < H(12)) return `Barbès opens for brunch at ${formatTime(barbes.opens)} today${music ? ", with live music tonight" : ""}: shakshuka, pain perdu and the patio on 13th & Park.`;
		if (barbes.opensToday) return `Tonight at Barbès: doors at ${formatTime(barbes.opens)}${music ? ", live music tonight" : ""}. Tagines, steak au poivre and Rock’n Moroccans on 13th & Park.`;
		return `Barbès reopens ${barbes.opens < H(12) ? "for brunch " : ""}tomorrow at ${formatTime(barbes.opens)}, up on 13th & Park.`;
	},
};

function render() {
	const now = hobokenNow();
	document.querySelectorAll("[data-status]").forEach((el) => {
		const key = el.dataset.status;
		el.classList.toggle("is-open", stateOf(key, now).open);
		el.classList.toggle("is-closed", !stateOf(key, now).open);
		const text = el.querySelector("[data-status-text]") ?? el;
		text.textContent = statusText(key, now);
	});
	document.querySelectorAll("[data-relay]").forEach((el) => {
		el.textContent = RELAY[el.dataset.relay](now);
	});
	document.querySelectorAll("[data-hours] tr").forEach((row) => {
		row.classList.toggle("is-today", Number(row.dataset.day) === now.day);
	});
	document.querySelectorAll("[data-weekday]").forEach((el) => {
		el.classList.toggle("is-today", el.dataset.weekday.split(",").map(Number).includes(now.day));
	});
	document.querySelectorAll("[data-today-name]").forEach((el) => {
		el.textContent = DAYS[now.day];
	});
	// The family day clock shows today's real hours and a "now" marker.
	document.querySelectorAll(".horloge").forEach((clock) => {
		clock.querySelectorAll("[data-bar]").forEach((bar) => {
			const [opens, closes] = HOUSES[bar.dataset.bar].hours[now.day];
			bar.style.setProperty("--from", opens / 60);
			bar.style.setProperty("--to", Math.min(closes, H(25)) / 60);
			bar.querySelector("[data-bar-label]").textContent = `${formatTime(opens)} – ${formatTime(closes)}`;
		});
		const hour = now.minute / 60 < 1 ? now.minute / 60 + 24 : now.minute / 60;
		clock.querySelectorAll(".horloge__now").forEach((marker) => {
			marker.hidden = hour < 6 || hour > 25;
			marker.style.setProperty("--now", hour);
		});
	});
}

function setupTabs() {
	document.querySelectorAll('[role="tablist"]').forEach((list) => {
		const tabs = [...list.querySelectorAll('[role="tab"]')];
		const select = (tab) => {
			tabs.forEach((t) => {
				const selected = t === tab;
				t.setAttribute("aria-selected", String(selected));
				t.tabIndex = selected ? 0 : -1;
				document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
			});
		};
		document.querySelectorAll("[data-open-tab]").forEach((link) => {
			const tab = tabs.find((t) => t.id === link.dataset.openTab);
			if (tab) link.addEventListener("click", () => select(tab));
		});
		tabs.forEach((tab, i) => {
			tab.addEventListener("click", () => select(tab));
			tab.addEventListener("keydown", (event) => {
				const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
				if (!step) return;
				const next = tabs[(i + step + tabs.length) % tabs.length];
				select(next);
				next.focus();
			});
		});
	});
}

// One event planner for the whole family. It suggests the house that fits the party:
// daytime gatherings and smaller groups at Café Tati, evenings and bigger parties at Barbès.
// It opens a pre-filled email, so it needs no server (RESEARCH.md: production should store inquiries).
function setupPlanner() {
	const form = document.querySelector("[data-planner]");
	if (!form) return;
	const f = form.elements;
	const suggestion = form.querySelector("[data-suggest]");
	const message = form.querySelector("[data-planner-msg]");

	const suggest = () => {
		const guests = Number(f.guests.value) || 0;
		const evening = f.when.value === "evening";
		const tati = !evening && guests <= 30;
		const house = tati ? "tati" : "barbes";
		if (!form.dataset.touched) f.house.value = house;
		suggestion.innerHTML = tati
			? "<b>Café Tati suits this one.</b> Daytime parties, showers and kids’ birthdays on the corner of 4th & Bloomfield, BYOB, with crêpes and pastries for the table."
			: "<b>Barbès suits this one.</b> Evening parties and bigger groups, with the bar, tagines for the table and live music on Fridays and Saturdays.";
	};
	[f.when, f.guests].forEach((field) => field.addEventListener("input", suggest));
	form.querySelectorAll('[name="house"]').forEach((radio) => radio.addEventListener("change", () => (form.dataset.touched = "1")));
	suggest();

	form.addEventListener("submit", (event) => {
		event.preventDefault();
		const required = [f.name, f.contact];
		const missing = required.filter((field) => !field.value.trim());
		required.forEach((field) => field.setAttribute("aria-invalid", String(missing.includes(field))));
		if (missing.length) {
			message.textContent = "Please add your name and a phone number or email so we can reply.";
			missing[0].focus();
			return;
		}
		const house = HOUSES[f.house.value].name;
		const body = [
			`House: ${house}`,
			`Occasion: ${f.occasion.value || "not specified"}`,
			`Date: ${f.date.value || "flexible"}`,
			`Time of day: ${f.when.value}`,
			`Guests: ${f.guests.value || "not sure yet"}`,
			`Name: ${f.name.value.trim()}`,
			`Contact: ${f.contact.value.trim()}`,
			"",
			f.notes.value.trim(),
		].join("\n");
		const subject = `Party inquiry for ${house}${f.date.value ? ` on ${f.date.value}` : ""}`;
		location.href = `mailto:info@barbesrestaurant.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
		message.textContent = "Your email app should open with everything filled in. Just press send.";
	});
}

function setupMasthead() {
	const masthead = document.querySelector("[data-masthead]");
	if (!masthead) return;
	const update = () => masthead.classList.toggle("is-scrolled", scrollY > 12);
	update();
	addEventListener("scroll", update, { passive: true });
}

function setupNav() {
	const toggle = document.querySelector("[data-nav-toggle]");
	const nav = document.getElementById(toggle?.getAttribute("aria-controls"));
	if (!toggle || !nav) return;
	const close = () => {
		toggle.setAttribute("aria-expanded", "false");
		nav.classList.remove("is-open");
	};
	toggle.addEventListener("click", () => {
		const open = toggle.getAttribute("aria-expanded") !== "true";
		toggle.setAttribute("aria-expanded", String(open));
		nav.classList.toggle("is-open", open);
	});
	nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
	addEventListener("keydown", (e) => e.key === "Escape" && close());
}

// Café Tati's name: TITA, the founder's mother's nickname, with two letters swapped.
function setupSwap() {
	const swap = document.querySelector("[data-swap]");
	if (!swap) return;
	const button = swap.querySelector("button");
	const label = swap.querySelector("[data-swap-label]");
	const set = (swapped) => {
		swap.classList.toggle("is-swapped", swapped);
		button.setAttribute("aria-pressed", String(swapped));
		label.textContent = swapped ? "TATI" : "TITA";
	};
	button.addEventListener("click", () => set(!swap.classList.contains("is-swapped")));
	const io = new IntersectionObserver(([entry]) => {
		if (!entry.isIntersecting) return;
		setTimeout(() => set(true), 500);
		io.disconnect();
	}, { threshold: 0.6 });
	io.observe(swap);
}

render();
setInterval(render, 60_000);
setupSwap();
setupTabs();
setupPlanner();
setupMasthead();
setupNav();
