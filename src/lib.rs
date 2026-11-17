use serde_json::{Value, json};
use squadron_extension_api::{Agent, Extension, host, squadron_extension};
use std::cell::RefCell;
use std::time::{SystemTime, UNIX_EPOCH};

const PANEL: &str = "main";
const BURST: u32 = 24;
const RELOAD_MS: u64 = 4000;
const RESUME_MS: u64 = 20000;
const RECHECK_S: u32 = 300;
const STATUS_CHECK_MS: u64 = 5000;

#[derive(Default)]
struct Live {
    open: bool,
    closed_at: u64,
    second: u64,
    relayed: u32,
    stale: bool,
    layout: String,
    checked: u64,
}

thread_local! {
    static LIVE: RefCell<Live> = RefCell::new(Live::default());
}

fn now() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0)
}

fn post(message: &Value) {
    host::panel_post(PANEL, &message.to_string());
}

fn stored(key: &str) -> Value {
    host::state_get(key).and_then(|s| serde_json::from_str(&s).ok()).unwrap_or(Value::Null)
}

fn store(key: &str, value: &Value) {
    let text = value.to_string();
    host::state_set(key, if value.is_null() { None } else { Some(text.as_str()) });
}

fn projects() -> Value {
    let list = host::projects().unwrap_or_default();
    Value::Array(
        list.into_iter()
            .map(|p| {
                json!({
                    "id": p.id, "name": p.name, "color": p.color, "group": p.group, "archived": p.archived,
                    "active": p.active, "week_agents": p.week_agents, "agents": p.agents,
                })
            })
            .collect(),
    )
}

fn groups() -> Value {
    let list = host::groups().unwrap_or_default();
    Value::Array(list.into_iter().map(|g| json!({ "id": g.id, "name": g.name, "parent": g.parent })).collect())
}

fn agents() -> Value {
    let list = host::all_agents().unwrap_or_default();
    Value::Array(
        list.into_iter()
            .filter(|a| !a.archived)
            .map(|a| {
                json!({
                    "id": a.id, "project": a.project, "name": a.name, "status": a.status, "waiting": a.waiting,
                    "tool": a.tool, "error": a.error, "by": a.by, "archived": a.archived, "since": a.since,
                })
            })
            .collect(),
    )
}

fn usage() -> Value {
    match host::usage() {
        Ok(u) => {
            let window = |w: Option<squadron_extension_api::bindings::squadron::api::types::UsageWindow>| {
                w.map(|w| json!({ "utilization": w.utilization, "resets_at": w.resets_at })).unwrap_or(Value::Null)
            };
            json!({ "five_hour": window(u.five_hour), "seven_day": window(u.seven_day), "api": u.api, "retries": u.retries, "since": u.since })
        }
        Err(_) => Value::Null,
    }
}

fn layout_key(projects: &Value, groups: &Value) -> String {
    let tier = |n: u64| match n {
        0 => 0,
        1 => 1,
        2..=3 => 2,
        4..=10 => 3,
        11..=19 => 4,
        _ => 5,
    };
    let mut rows: Vec<String> = projects
        .as_array()
        .map(|l| {
            l.iter()
                .filter(|p| !p["archived"].as_bool().unwrap_or(false) && p["week_agents"].as_u64().unwrap_or(0) > 0)
                .map(|p| format!("{}|{}|{}|{}|{}", p["id"], p["name"], p["color"], p["group"], tier(p["week_agents"].as_u64().unwrap_or(0))))
                .collect()
        })
        .unwrap_or_default();
    rows.sort();
    format!("{}#{}", rows.join(";"), groups)
}

fn check_layout(force: bool) {
    let (p, g) = (projects(), groups());
    let key = layout_key(&p, &g);
    let changed = LIVE.with(|l| {
        let mut l = l.borrow_mut();
        let changed = l.layout != key;
        l.layout = key;
        changed
    });
    if changed || force {
        post(&json!({ "type": "projects", "projects": p, "groups": g }));
    }
}

fn ready() {
    let t = now();
    let resume = stored("resume");
    let quick = LIVE.with(|l| {
        let l = l.borrow();
        l.closed_at > 0 && t.saturating_sub(l.closed_at) < RELOAD_MS
    });
    let within = resume["within"].as_u64().unwrap_or(RESUME_MS);
    let shown = resume["at"].as_u64().is_some_and(|at| t.saturating_sub(at) < within);
    store("resume", &Value::Null);
    let (p, g) = (projects(), groups());
    LIVE.with(|l| {
        let mut l = l.borrow_mut();
        l.open = true;
        l.stale = false;
        l.layout = layout_key(&p, &g);
    });
    post(&json!({
        "type": "init",
        "projects": p,
        "groups": g,
        "agents": agents(),
        "usage": usage(),
        "layouts": stored("layouts"),
        "view": stored("view"),
        "resume": shown || quick,
        "now": t,
    }));
    host::set_timer(RECHECK_S);
}

fn page(message: &Value) {
    match message["type"].as_str().unwrap_or("") {
        "ready" => ready(),
        "view" => store("view", &message["view"]),
        "layouts" => store("layouts", &message["layouts"]),
        "sync" => {
            snapshot();
            check_layout(true);
        }
        "show" => {
            let id = message["id"].as_str().unwrap_or("");
            store("resume", &json!({ "at": now() }));
            if let Err(e) = host::show_agent(id) {
                store("resume", &Value::Null);
                post(&json!({ "type": "showFailed", "error": e }));
            }
        }
        _ => {}
    }
}

enum Flow {
    Relay,
    Snapshot,
    Drop,
}

fn snapshot() {
    post(&json!({ "type": "agents", "agents": agents() }));
}

fn relay(name: &str, data: &str) {
    if name.starts_with("agent.") {
        let second = now() / 1000;
        let flow = LIVE.with(|l| {
            let mut l = l.borrow_mut();
            if l.second != second {
                let was = l.stale;
                l.second = second;
                l.relayed = 0;
                l.stale = false;
                if was {
                    return Flow::Snapshot;
                }
            }
            if l.stale {
                return Flow::Drop;
            }
            l.relayed += 1;
            if l.relayed > BURST {
                l.stale = true;
                return Flow::Snapshot;
            }
            Flow::Relay
        });
        match flow {
            Flow::Drop => return,
            Flow::Snapshot => {
                snapshot();
                if LIVE.with(|l| l.borrow().stale) {
                    host::set_timer(10);
                }
                return;
            }
            Flow::Relay => {}
        }
    }
    let data: Value = serde_json::from_str(data).unwrap_or(Value::Null);
    post(&json!({ "type": "event", "name": name, "data": data }));
    if name == "agent.started" || name == "agent.archived" {
        check_layout(false);
    } else if name == "agent.status" {
        let t = now();
        let due = LIVE.with(|l| {
            let mut l = l.borrow_mut();
            let due = t.saturating_sub(l.checked) >= STATUS_CHECK_MS;
            if due {
                l.checked = t;
            }
            due
        });
        if due {
            check_layout(false);
        }
    }
}

struct Office;

impl Extension for Office {
    fn on_event(name: String, _agent: Option<Agent>, data: String) {
        match name.as_str() {
            "started" => {
                store("resume", &json!({ "at": now(), "within": RELOAD_MS }));
                post(&json!({ "type": "reload" }));
            }
            "panel.message" => {
                let v: Value = serde_json::from_str(&data).unwrap_or(Value::Null);
                if v["panel"] == PANEL {
                    page(&v["message"]);
                }
            }
            "panel.closed" => LIVE.with(|l| {
                let mut l = l.borrow_mut();
                l.open = false;
                l.closed_at = now();
            }),
            "timer" => {
                if LIVE.with(|l| l.borrow().open) {
                    if LIVE.with(|l| std::mem::take(&mut l.borrow_mut().stale)) {
                        snapshot();
                    }
                    check_layout(false);
                    host::set_timer(RECHECK_S);
                }
            }
            _ => {
                if LIVE.with(|l| l.borrow().open) {
                    relay(&name, &data);
                }
            }
        }
    }
}

squadron_extension!(Office);
