"use client";

import { useMemo, useState } from "react";

type DomainStatus =
  | "active"
  | "imported"
  | "waiting_ns"
  | "processing"
  | "error";

type Domain = {
  id: number;
  name: string;
  status: DomainStatus;
  namecheap: string;
  cloudflare: string | null;
  ip: string | null;
  ns1: string | null;
  ns2: string | null;
  expires: string;
  lastSync: string;
  error?: string;
};

type DnsRecord = {
  id: number;
  type: "A" | "CNAME" | "TXT";
  name: string;
  content: string;
  proxied: boolean;
};

const accounts = [
  {
    id: "nc-demo-01",
    label: "Namecheap Demo 01",
    detail: "demo-nc-user-001",
    used: 245,
    limit: 300,
    expiring: 12,
    tone: "violet",
  },
  {
    id: "nc-demo-02",
    label: "Namecheap Demo 02",
    detail: "demo-nc-user-002",
    used: 168,
    limit: 250,
    expiring: 4,
    tone: "cyan",
  },
  {
    id: "nc-demo-03",
    label: "Namecheap Demo 03",
    detail: "demo-nc-user-003",
    used: 92,
    limit: 200,
    expiring: 1,
    tone: "amber",
  },
];

const initialDomains: Domain[] = [
  {
    id: 15658,
    name: "alpha-landing.example",
    status: "active",
    namecheap: "Namecheap Demo 01",
    cloudflare: "Cloudflare Demo 01",
    ip: "192.0.2.10",
    ns1: "ns1.cloudflare-demo.example",
    ns2: "ns2.cloudflare-demo.example",
    expires: "30 Jul 2027",
    lastSync: "2 min ago",
  },
  {
    id: 15657,
    name: "bravo-campaign.example",
    status: "active",
    namecheap: "Namecheap Demo 01",
    cloudflare: "Cloudflare Demo 01",
    ip: "192.0.2.10",
    ns1: "ns1.cloudflare-demo.example",
    ns2: "ns2.cloudflare-demo.example",
    expires: "18 Jul 2027",
    lastSync: "2 min ago",
  },
  {
    id: 15656,
    name: "charlie-offer.example",
    status: "waiting_ns",
    namecheap: "Namecheap Demo 01",
    cloudflare: "Cloudflare Demo 01",
    ip: "192.0.2.10",
    ns1: "ns3.cloudflare-demo.example",
    ns2: "ns4.cloudflare-demo.example",
    expires: "18 Jul 2027",
    lastSync: "5 min ago",
  },
  {
    id: 15655,
    name: "delta-preview.example",
    status: "active",
    namecheap: "Namecheap Demo 02",
    cloudflare: "Cloudflare Demo 02",
    ip: "198.51.100.24",
    ns1: "ns3.cloudflare-demo.example",
    ns2: "ns4.cloudflare-demo.example",
    expires: "04 Jul 2027",
    lastSync: "8 min ago",
  },
  {
    id: 15654,
    name: "echo-project.example",
    status: "imported",
    namecheap: "Namecheap Demo 02",
    cloudflare: null,
    ip: null,
    ns1: null,
    ns2: null,
    expires: "01 Aug 2027",
    lastSync: "12 min ago",
  },
  {
    id: 15653,
    name: "foxtrot-media.example",
    status: "imported",
    namecheap: "Namecheap Demo 03",
    cloudflare: null,
    ip: null,
    ns1: null,
    ns2: null,
    expires: "29 Jul 2027",
    lastSync: "12 min ago",
  },
  {
    id: 15652,
    name: "gamma-campaign.example",
    status: "processing",
    namecheap: "Namecheap Demo 01",
    cloudflare: "Cloudflare Demo 01",
    ip: "192.0.2.10",
    ns1: null,
    ns2: null,
    expires: "22 Jul 2027",
    lastSync: "now",
  },
  {
    id: 15651,
    name: "hotel-preview.example",
    status: "error",
    namecheap: "Namecheap Demo 02",
    cloudflare: "Cloudflare Demo 02",
    ip: "198.51.100.24",
    ns1: null,
    ns2: null,
    expires: "16 Aug 2027",
    lastSync: "23 min ago",
    error: "Namecheap API: nameserver update rejected",
  },
  {
    id: 15650,
    name: "india-landing.example",
    status: "active",
    namecheap: "Namecheap Demo 01",
    cloudflare: "Cloudflare Demo 01",
    ip: "192.0.2.10",
    ns1: "ns1.cloudflare-demo.example",
    ns2: "ns2.cloudflare-demo.example",
    expires: "08 Sep 2027",
    lastSync: "31 min ago",
  },
];

const statusMeta: Record<
  DomainStatus,
  { label: string; dot: string; className: string }
> = {
  active: { label: "Active", dot: "●", className: "status-active" },
  imported: { label: "Imported", dot: "○", className: "status-imported" },
  waiting_ns: { label: "Waiting for NS", dot: "◒", className: "status-waiting" },
  processing: { label: "Processing", dot: "◌", className: "status-processing" },
  error: { label: "Error", dot: "!", className: "status-error" },
};

const initialRecords: DnsRecord[] = [
  {
    id: 1,
    type: "A",
    name: "@",
    content: "192.0.2.10",
    proxied: true,
  },
  {
    id: 2,
    type: "A",
    name: "*",
    content: "192.0.2.10",
    proxied: true,
  },
];

function StatusPill({ status }: { status: DomainStatus }) {
  const item = statusMeta[status];
  return (
    <span className={`status-pill ${item.className}`}>
      <span aria-hidden="true">{item.dot}</span>
      {item.label}
    </span>
  );
}

export default function Home() {
  const [domains, setDomains] = useState(initialDomains);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [ncFilter, setNcFilter] = useState("all");
  const [cfFilter, setCfFilter] = useState("all");
  const [activeDomain, setActiveDomain] = useState<Domain | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "dns">("overview");
  const [records, setRecords] = useState(initialRecords);
  const [setupOpen, setSetupOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [setupAccount, setSetupAccount] = useState("Cloudflare Demo 01");
  const [serverIp, setServerIp] = useState("192.0.2.10");
  const [proxied, setProxied] = useState(true);
  const [jobRunning, setJobRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState("2 min ago");

  const filteredDomains = useMemo(() => {
    return domains.filter((domain) => {
      const matchesSearch = domain.name
        .toLowerCase()
        .includes(search.toLowerCase().trim());
      const matchesStatus = status === "all" || domain.status === status;
      const matchesNc = ncFilter === "all" || domain.namecheap === ncFilter;
      const matchesCf =
        cfFilter === "all" ||
        (cfFilter === "none" && !domain.cloudflare) ||
        domain.cloudflare === cfFilter;
      return matchesSearch && matchesStatus && matchesNc && matchesCf;
    });
  }, [domains, search, status, ncFilter, cfFilter]);

  const allVisibleSelected =
    filteredDomains.length > 0 &&
    filteredDomains.every((domain) => selected.includes(domain.id));

  const activeCount = domains.filter((domain) => domain.status === "active").length;
  const attentionCount = domains.filter((domain) =>
    ["waiting_ns", "error"].includes(domain.status),
  ).length;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  }

  function toggleSelected(id: number) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelected((current) =>
        current.filter((id) => !filteredDomains.some((domain) => domain.id === id)),
      );
      return;
    }
    setSelected((current) => [
      ...new Set([...current, ...filteredDomains.map((domain) => domain.id)]),
    ]);
  }

  function openDomain(domain: Domain) {
    setActiveDomain(domain);
    setDrawerTab("overview");
    setRecords(
      domain.ip
        ? [
            { id: 1, type: "A", name: "@", content: domain.ip, proxied: true },
            { id: 2, type: "A", name: "*", content: domain.ip, proxied: true },
          ]
        : [],
    );
  }

  function importDomains() {
    const imported: Domain[] = [
      {
        id: 15661,
        name: "kilo-demo.example",
        status: "imported",
        namecheap: "Namecheap Demo 01",
        cloudflare: null,
        ip: null,
        ns1: null,
        ns2: null,
        expires: "31 Jul 2027",
        lastSync: "now",
      },
      {
        id: 15660,
        name: "lima-demo.example",
        status: "imported",
        namecheap: "Namecheap Demo 01",
        cloudflare: null,
        ip: null,
        ns1: null,
        ns2: null,
        expires: "31 Jul 2027",
        lastSync: "now",
      },
    ];
    setDomains((current) => {
      const ids = new Set(current.map((domain) => domain.id));
      return [...imported.filter((domain) => !ids.has(domain.id)), ...current];
    });
    showToast("2 new domains imported from Namecheap");
  }

  function refreshStatuses() {
    setLastSync("just now");
    setDomains((current) =>
      current.map((domain) => ({
        ...domain,
        lastSync: domain.status === "processing" ? "now" : domain.lastSync,
      })),
    );
    showToast("Domain statuses refreshed");
  }

  function startCloudflareSetup() {
    if (!selected.length || !serverIp.trim()) return;
    setJobRunning(true);
    setSetupOpen(false);
    setDomains((current) =>
      current.map((domain) =>
        selected.includes(domain.id)
          ? {
              ...domain,
              status: "processing",
              cloudflare: setupAccount,
              ip: serverIp,
              error: undefined,
              lastSync: "now",
            }
          : domain,
      ),
    );
    window.setTimeout(() => {
      setDomains((current) =>
        current.map((domain) =>
          selected.includes(domain.id)
            ? {
                ...domain,
                status: "waiting_ns",
                ns1: "ns3.cloudflare-demo.example",
                ns2: "ns4.cloudflare-demo.example",
                lastSync: "just now",
              }
            : domain,
        ),
      );
      setJobRunning(false);
      showToast(`${selected.length} domains sent to Cloudflare`);
      setSelected([]);
    }, 2200);
  }

  function addDnsRecord() {
    const ip = activeDomain?.ip || "192.0.2.10";
    setRecords((current) => [
      ...current,
      {
        id: Date.now(),
        type: "A",
        name: "www",
        content: ip,
        proxied: true,
      },
    ]);
    showToast("DNS record added");
  }

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setNcFilter("all");
    setCfFilter("all");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            D
          </span>
          <div>
            <h1>Domain Tool</h1>
            <p>Namecheap → Cloudflare, without the busywork</p>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="demo-badge">Synthetic demo data</span>
          <div className="sync-meta">
            <span className="live-dot" />
            Last sync: {lastSync}
          </div>
          <button className="button button-ghost" onClick={() => setAccountsOpen(true)}>
            Manage accounts
          </button>
          <button className="avatar" aria-label="Open profile">
            DU
          </button>
        </div>
      </header>

      <section className="page">
        <div className="overview-heading">
          <div>
            <p className="eyebrow">Portfolio overview</p>
            <h2>Move domains. Keep control.</h2>
          </div>
          <div className="summary-line" aria-label="Domain summary">
            <span>
              <strong>{domains.length}</strong> domains loaded
            </span>
            <span>
              <strong>{activeCount}</strong> active
            </span>
            <span className={attentionCount ? "attention" : ""}>
              <strong>{attentionCount}</strong> need attention
            </span>
          </div>
        </div>

        <section className="account-grid" aria-label="Namecheap account capacity">
          {accounts.map((account) => {
            const percentage = Math.round((account.used / account.limit) * 100);
            return (
              <article className="account-card" key={account.id}>
                <div className="account-card-top">
                  <div className="account-icon nc">NC</div>
                  <div>
                    <h3>{account.label}</h3>
                    <p>{account.detail}</p>
                  </div>
                  <span className="verified">Connected</span>
                </div>
                <div className="capacity-row">
                  <div>
                    <strong>{account.used}</strong>
                    <span> / {account.limit} domains</span>
                  </div>
                  <span className={percentage >= 80 ? "capacity-high" : ""}>
                    {percentage}%
                  </span>
                </div>
                <div className="progress-track">
                  <span
                    className={`progress-fill ${account.tone}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="account-footer">
                  <span>{account.limit - account.used} slots available</span>
                  <span className={account.expiring > 8 ? "attention" : ""}>
                    {account.expiring} expiring soon
                  </span>
                </div>
              </article>
            );
          })}
          <button className="add-account-card" onClick={() => setAccountsOpen(true)}>
            <span className="plus">+</span>
            <span>
              <strong>Add account</strong>
              <small>Namecheap or Cloudflare</small>
            </span>
          </button>
        </section>

        <section className="workspace">
          <div className="workspace-header">
            <div>
              <p className="eyebrow">Domain workspace</p>
              <h2>All domains</h2>
            </div>
            <div className="primary-actions">
              <button className="button button-secondary" onClick={refreshStatuses}>
                <span aria-hidden="true">↻</span> Refresh
              </button>
              <button className="button button-orange" onClick={importDomains}>
                <span aria-hidden="true">↓</span> Import from Namecheap
              </button>
              <button
                className="button button-primary"
                disabled={!selected.length}
                onClick={() => setSetupOpen(true)}
              >
                <span aria-hidden="true">✦</span> Add to Cloudflare
              </button>
            </div>
          </div>

          {jobRunning && (
            <div className="job-banner" role="status">
              <span className="spinner" />
              <div>
                <strong>Cloudflare setup is running</strong>
                <small>Creating zones and requesting nameservers…</small>
              </div>
              <span>{selected.length} domains</span>
            </div>
          )}

          <div className="filters">
            <label className="search-field">
              <span aria-hidden="true">⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search domains…"
                aria-label="Search domains"
              />
              <kbd>⌘ K</kbd>
            </label>
            <label>
              <span className="sr-only">Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="imported">Imported</option>
                <option value="waiting_ns">Waiting for NS</option>
                <option value="processing">Processing</option>
                <option value="error">Error</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Namecheap account</span>
              <select
                value={ncFilter}
                onChange={(event) => setNcFilter(event.target.value)}
              >
                <option value="all">All Namecheap</option>
                <option value="Namecheap Demo 01">Namecheap Demo 01</option>
                <option value="Namecheap Demo 02">Namecheap Demo 02</option>
                <option value="Namecheap Demo 03">Namecheap Demo 03</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Cloudflare account</span>
              <select
                value={cfFilter}
                onChange={(event) => setCfFilter(event.target.value)}
              >
                <option value="all">All Cloudflare</option>
                <option value="Cloudflare Demo 01">Cloudflare Demo 01</option>
                <option value="Cloudflare Demo 02">Cloudflare Demo 02</option>
                <option value="none">Not connected</option>
              </select>
            </label>
            <button className="clear-filters" onClick={resetFilters}>
              Clear
            </button>
          </div>

          {selected.length > 0 && (
            <div className="bulk-bar">
              <div>
                <span className="selection-count">{selected.length}</span>
                <strong>domains selected</strong>
              </div>
              <div className="bulk-actions">
                <button onClick={() => setSetupOpen(true)}>Add to Cloudflare</button>
                <button
                  onClick={() => {
                    showToast("IP change will use the Cloudflare setup dialog");
                    setSetupOpen(true);
                  }}
                >
                  Change IP
                </button>
                <button onClick={refreshStatuses}>Update NS</button>
                <button className="bulk-clear" onClick={() => setSelected([])}>
                  Clear selection
                </button>
              </div>
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="check-cell">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="Select all visible domains"
                    />
                  </th>
                  <th>Domain</th>
                  <th>Status</th>
                  <th>Namecheap</th>
                  <th>Cloudflare</th>
                  <th>Server IP</th>
                  <th>Expires</th>
                  <th>Last sync</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredDomains.map((domain) => (
                  <tr
                    key={domain.id}
                    className={selected.includes(domain.id) ? "selected-row" : ""}
                  >
                    <td className="check-cell">
                      <input
                        type="checkbox"
                        checked={selected.includes(domain.id)}
                        onChange={() => toggleSelected(domain.id)}
                        aria-label={`Select ${domain.name}`}
                      />
                    </td>
                    <td>
                      <button className="domain-link" onClick={() => openDomain(domain)}>
                        <span className="domain-favicon">
                          {domain.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span>
                          <strong>{domain.name}</strong>
                          <small>#{domain.id}</small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <StatusPill status={domain.status} />
                      {domain.error && <small className="row-error">{domain.error}</small>}
                    </td>
                    <td>
                      <span className="provider-cell">
                        <span className="mini-logo nc">NC</span>
                        {domain.namecheap}
                      </span>
                    </td>
                    <td>
                      {domain.cloudflare ? (
                        <span className="provider-cell">
                          <span className="mini-logo cf">CF</span>
                          {domain.cloudflare}
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="mono">{domain.ip || "—"}</td>
                    <td>{domain.expires}</td>
                    <td className="muted">{domain.lastSync}</td>
                    <td>
                      <button
                        className="icon-button"
                        onClick={() => openDomain(domain)}
                        aria-label={`Open ${domain.name}`}
                      >
                        ···
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredDomains.length && (
              <div className="empty-state">
                <span>⌕</span>
                <h3>No domains match these filters</h3>
                <button onClick={resetFilters}>Clear filters</button>
              </div>
            )}
          </div>

          <footer className="table-footer">
            <span>
              Showing <strong>{filteredDomains.length}</strong> of{" "}
              <strong>{domains.length}</strong> domains
            </span>
            <div className="pagination">
              <button disabled aria-label="Previous page">
                ←
              </button>
              <button className="current">1</button>
              <button>2</button>
              <button>3</button>
              <span>…</span>
              <button>43</button>
              <button aria-label="Next page">→</button>
            </div>
          </footer>
        </section>
      </section>

      {setupOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="setup-title"
          >
            <div className="modal-header">
              <div>
                <span className="modal-icon">CF</span>
                <div>
                  <p className="eyebrow">Bulk operation</p>
                  <h2 id="setup-title">Add to Cloudflare</h2>
                </div>
              </div>
              <button
                className="close-button"
                onClick={() => setSetupOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="selection-preview">
              <strong>{selected.length} domains selected</strong>
              <span>
                {domains
                  .filter((domain) => selected.includes(domain.id))
                  .slice(0, 3)
                  .map((domain) => domain.name)
                  .join(", ")}
                {selected.length > 3 ? ` +${selected.length - 3} more` : ""}
              </span>
            </div>
            <div className="form-grid">
              <label>
                <span>Cloudflare account</span>
                <select
                  value={setupAccount}
                  onChange={(event) => setSetupAccount(event.target.value)}
                >
                  <option>Cloudflare Demo 01</option>
                  <option>Cloudflare Demo 02</option>
                </select>
              </label>
              <label>
                <span>Buyer server IP</span>
                <input
                  value={serverIp}
                  onChange={(event) => setServerIp(event.target.value)}
                  placeholder="0.0.0.0"
                />
              </label>
            </div>
            <div className="dns-template">
              <div className="dns-template-heading">
                <div>
                  <strong>DNS template</strong>
                  <small>Records created for every domain</small>
                </div>
                <label className="switch-row">
                  <span>Cloudflare proxy</span>
                  <input
                    type="checkbox"
                    checked={proxied}
                    onChange={(event) => setProxied(event.target.checked)}
                  />
                  <span className="switch" />
                </label>
              </div>
              <div className="record-preview">
                <span className="record-type">A</span>
                <code>@</code>
                <span>→</span>
                <code>{serverIp || "Server IP"}</code>
                <span className={proxied ? "proxy-on" : "proxy-off"}>
                  {proxied ? "Proxied" : "DNS only"}
                </span>
              </div>
              <div className="record-preview">
                <span className="record-type">A</span>
                <code>*</code>
                <span>→</span>
                <code>{serverIp || "Server IP"}</code>
                <span className={proxied ? "proxy-on" : "proxy-off"}>
                  {proxied ? "Proxied" : "DNS only"}
                </span>
              </div>
            </div>
            <div className="process-note">
              <span aria-hidden="true">i</span>
              <p>
                The tool will create Cloudflare zones, update Namecheap
                nameservers and add both DNS records automatically.
              </p>
            </div>
            <div className="modal-actions">
              <button className="button button-ghost" onClick={() => setSetupOpen(false)}>
                Cancel
              </button>
              <button
                className="button button-primary"
                onClick={startCloudflareSetup}
                disabled={!serverIp.trim()}
              >
                Start setup
              </button>
            </div>
          </section>
        </div>
      )}

      {accountsOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="modal accounts-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="accounts-title"
          >
            <div className="modal-header">
              <div>
                <span className="modal-icon neutral">AC</span>
                <div>
                  <p className="eyebrow">Connections</p>
                  <h2 id="accounts-title">Connected accounts</h2>
                </div>
              </div>
              <button
                className="close-button"
                onClick={() => setAccountsOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="connected-list">
              {accounts.map((account) => (
                <article key={account.id}>
                  <span className="account-icon nc">NC</span>
                  <div>
                    <strong>{account.label}</strong>
                    <small>{account.detail}</small>
                  </div>
                  <span className="connection-status">Connected</span>
                  <button onClick={() => showToast(`${account.label} connection is healthy`)}>
                    Test
                  </button>
                </article>
              ))}
              <article>
                <span className="account-icon cf">CF</span>
                <div>
                  <strong>Cloudflare Demo 01</strong>
                  <small>API token · Zone + DNS edit</small>
                </div>
                <span className="connection-status">Connected</span>
                <button
                  onClick={() =>
                    showToast("Cloudflare Demo 01 connection is healthy")
                  }
                >
                  Test
                </button>
              </article>
            </div>
            <button className="add-connection-button">+ Add new connection</button>
          </section>
        </div>
      )}

      {activeDomain && (
        <>
          <button
            className="drawer-backdrop"
            onClick={() => setActiveDomain(null)}
            aria-label="Close domain details"
          />
          <aside className="drawer" aria-label={`${activeDomain.name} details`}>
            <div className="drawer-header">
              <div>
                <p className="eyebrow">Domain details</p>
                <h2>{activeDomain.name}</h2>
                <div className="drawer-pills">
                  <StatusPill status={activeDomain.status} />
                  <span className="service-pill cf">Cloudflare</span>
                  <span className="service-pill nc">Namecheap</span>
                </div>
              </div>
              <button
                className="close-button"
                onClick={() => setActiveDomain(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="drawer-tabs" role="tablist">
              <button
                className={drawerTab === "overview" ? "active" : ""}
                onClick={() => setDrawerTab("overview")}
                role="tab"
                aria-selected={drawerTab === "overview"}
              >
                Overview
              </button>
              <button
                className={drawerTab === "dns" ? "active" : ""}
                onClick={() => setDrawerTab("dns")}
                role="tab"
                aria-selected={drawerTab === "dns"}
              >
                DNS Records
                <span>{records.length}</span>
              </button>
            </div>
            {drawerTab === "overview" ? (
              <div className="drawer-content">
                <section className="detail-card">
                  <div className="detail-card-title">
                    <span className="account-icon nc">NC</span>
                    <div>
                      <p className="eyebrow">Namecheap</p>
                      <strong>{activeDomain.namecheap}</strong>
                    </div>
                    <button onClick={refreshStatuses}>Refresh</button>
                  </div>
                  <dl>
                    <div>
                      <dt>Registrar status</dt>
                      <dd className="ok-value">● Active</dd>
                    </div>
                    <div>
                      <dt>Expires</dt>
                      <dd>{activeDomain.expires}</dd>
                    </div>
                    <div>
                      <dt>Auto renew</dt>
                      <dd>Disabled</dd>
                    </div>
                  </dl>
                </section>
                <section className="detail-card">
                  <div className="detail-card-title">
                    <span className="account-icon cf">CF</span>
                    <div>
                      <p className="eyebrow">Cloudflare</p>
                      <strong>{activeDomain.cloudflare || "Not connected"}</strong>
                    </div>
                  </div>
                  <dl>
                    <div>
                      <dt>Server IP</dt>
                      <dd className="mono">{activeDomain.ip || "—"}</dd>
                    </div>
                    <div>
                      <dt>NS1</dt>
                      <dd className="mono">{activeDomain.ns1 || "Pending"}</dd>
                    </div>
                    <div>
                      <dt>NS2</dt>
                      <dd className="mono">{activeDomain.ns2 || "Pending"}</dd>
                    </div>
                  </dl>
                </section>
                <section className="activity-card">
                  <p className="eyebrow">Recent activity</p>
                  <ol>
                    <li>
                      <span className="activity-dot success" />
                      <div>
                        <strong>Domain synchronized</strong>
                        <small>{activeDomain.lastSync}</small>
                      </div>
                    </li>
                    {activeDomain.cloudflare && (
                      <li>
                        <span className="activity-dot" />
                        <div>
                          <strong>Cloudflare zone created</strong>
                          <small>30 Jul, 14:42</small>
                        </div>
                      </li>
                    )}
                    <li>
                      <span className="activity-dot muted-dot" />
                      <div>
                        <strong>Imported from Namecheap</strong>
                        <small>30 Jul, 14:39</small>
                      </div>
                    </li>
                  </ol>
                </section>
              </div>
            ) : (
              <div className="drawer-content">
                <div className="dns-heading">
                  <div>
                    <p className="eyebrow">DNS records</p>
                    <h3>{records.length} records</h3>
                  </div>
                  <button className="button button-primary compact" onClick={addDnsRecord}>
                    + Add record
                  </button>
                </div>
                <div className="dns-list">
                  {records.map((record) => (
                    <article key={record.id}>
                      <div className="dns-record-main">
                        <span className="record-type">{record.type}</span>
                        <div>
                          <strong>
                            {record.name === "@"
                              ? activeDomain.name
                              : `${record.name}.${activeDomain.name}`}
                          </strong>
                          <code>{record.content}</code>
                        </div>
                        <span className={record.proxied ? "cloud-on" : "cloud-off"}>
                          {record.proxied ? "● Proxied" : "○ DNS only"}
                        </span>
                      </div>
                      <div className="dns-record-actions">
                        <span>TTL Auto</span>
                        <button
                          onClick={() =>
                            setRecords((current) =>
                              current.map((item) =>
                                item.id === record.id
                                  ? { ...item, proxied: !item.proxied }
                                  : item,
                              ),
                            )
                          }
                        >
                          Toggle proxy
                        </button>
                        <button
                          className="danger-link"
                          onClick={() =>
                            setRecords((current) =>
                              current.filter((item) => item.id !== record.id),
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                  {!records.length && (
                    <div className="empty-state compact-empty">
                      <span>DNS</span>
                      <h3>No DNS records yet</h3>
                      <p>Add the first record for this domain.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </>
      )}

      {toast && (
        <div className="toast" role="status">
          <span>✓</span>
          {toast}
        </div>
      )}
    </main>
  );
}
