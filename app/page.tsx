"use client";

import { useMemo, useState } from "react";

type DomainStatus =
  | "active"
  | "generated"
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

type AddedConnection = {
  id: string | number;
  type: "cloudflare" | "namecheap";
  label: string;
  detail: string;
};

type PurchaseRow = {
  date: string;
  buyer: string;
  account: string;
  server: string;
  domains: number;
  unitPrice: number;
};

const initialNamecheapAccounts = [
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

const initialCloudflareAccounts: AddedConnection[] = [
  {
    id: "cf-demo-01",
    type: "cloudflare",
    label: "Cloudflare Demo 01",
    detail: "Demo API token · Zone + DNS edit",
  },
  {
    id: "cf-demo-02",
    type: "cloudflare",
    label: "Cloudflare Demo 02",
    detail: "Demo API token · Zone + DNS edit",
  },
];

const purchaseRows: PurchaseRow[] = [
  {
    date: "2026-07-03",
    buyer: "Buyer Demo A",
    account: "Namecheap Demo 01",
    server: "Test Server Alpha",
    domains: 8,
    unitPrice: 2.18,
  },
  {
    date: "2026-07-08",
    buyer: "Buyer Demo B",
    account: "Namecheap Demo 02",
    server: "Test Server Beta",
    domains: 6,
    unitPrice: 3.12,
  },
  {
    date: "2026-07-12",
    buyer: "Buyer Demo A",
    account: "Namecheap Demo 01",
    server: "Test Server Alpha",
    domains: 12,
    unitPrice: 2.18,
  },
  {
    date: "2026-07-19",
    buyer: "Buyer Demo C",
    account: "Namecheap Demo 03",
    server: "Unassigned",
    domains: 5,
    unitPrice: 4.08,
  },
  {
    date: "2026-07-24",
    buyer: "Buyer Demo B",
    account: "Namecheap Demo 02",
    server: "Test Server Gamma",
    domains: 7,
    unitPrice: 3.12,
  },
  {
    date: "2026-07-29",
    buyer: "Unassigned",
    account: "Namecheap Demo 01",
    server: "Unassigned",
    domains: 4,
    unitPrice: 2.18,
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
  generated: { label: "Generated", dot: "✦", className: "status-generated" },
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
  const [namecheapAccounts, setNamecheapAccounts] = useState(initialNamecheapAccounts);
  const [cloudflareAccounts, setCloudflareAccounts] = useState(
    initialCloudflareAccounts,
  );
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkCheckOpen, setBulkCheckOpen] = useState(true);
  const [bulkInput, setBulkInput] = useState("alpha-landing.example");
  const [bulkDbOnly, setBulkDbOnly] = useState(false);
  const [bulkDomainNames, setBulkDomainNames] = useState<string[]>([]);
  const [bulkResult, setBulkResult] = useState<{
    queried: number;
    found: number;
    missing: number;
  } | null>(null);
  const [resetFromDatabase, setResetFromDatabase] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [ncFilter, setNcFilter] = useState("all");
  const [cfFilter, setCfFilter] = useState("all");
  const [activeDomain, setActiveDomain] = useState<Domain | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "dns">("overview");
  const [records, setRecords] = useState(initialRecords);
  const [setupOpen, setSetupOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [purchasesOpen, setPurchasesOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [purchaseTab, setPurchaseTab] = useState("overview");
  const [purchaseFrom, setPurchaseFrom] = useState("2026-07-01");
  const [purchaseTo, setPurchaseTo] = useState("2026-07-31");
  const [generatorType, setGeneratorType] = useState("vowel-consonant");
  const [generatorTld, setGeneratorTld] = useState("example");
  const [generatorCount, setGeneratorCount] = useState("10");
  const [saveGenerated, setSaveGenerated] = useState(true);
  const [accountType, setAccountType] = useState<"cloudflare" | "namecheap">(
    "cloudflare",
  );
  const [accountLabel, setAccountLabel] = useState("");
  const [accountUsername, setAccountUsername] = useState("");
  const [accountSecret, setAccountSecret] = useState("");
  const [accountClientIp, setAccountClientIp] = useState("192.0.2.50");
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
      const matchesBulk =
        bulkDomainNames.length === 0 ||
        bulkDomainNames.includes(domain.name.toLowerCase());
      return matchesSearch && matchesStatus && matchesNc && matchesCf && matchesBulk;
    });
  }, [domains, search, status, ncFilter, cfFilter, bulkDomainNames]);

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

  function generateDomains() {
    const requestedCount = Number.parseInt(generatorCount, 10);
    const count = Math.min(Math.max(Number.isNaN(requestedCount) ? 1 : requestedCount, 1), 50);
    const tld =
      generatorTld
        .trim()
        .toLowerCase()
        .replace(/^\.+/, "")
        .replace(/[^a-z0-9-]/g, "") || "example";
    const phoneticNames = [
      "lumavi",
      "denoro",
      "kaseti",
      "rimavo",
      "beluni",
      "tosari",
      "navelo",
      "pidaru",
      "zelomi",
      "fureta",
    ];
    const wordNames = [
      "bright-path",
      "north-star",
      "clear-view",
      "smart-route",
      "fresh-start",
      "open-field",
      "next-wave",
      "prime-point",
      "blue-orbit",
      "good-signal",
    ];
    const timestamp = Date.now();
    const generated: Domain[] = Array.from({ length: count }, (_, index) => {
      const source = generatorType === "words" ? wordNames : phoneticNames;
      const cycle = Math.floor(index / source.length);
      const base = `${source[index % source.length]}${cycle ? `-${cycle + 1}` : ""}`;

      return {
        id: timestamp + index,
        name: `${base}.${tld}`,
        status: "generated",
        namecheap: "Not assigned",
        cloudflare: null,
        ip: null,
        ns1: null,
        ns2: null,
        expires: "Not registered",
        lastSync: "now",
      };
    });

    if (saveGenerated) {
      setDomains((current) => [...generated, ...current]);
      showToast(`${count} test domain names added to the workspace`);
    } else {
      showToast(`${count} test domain names generated (preview only)`);
    }
  }

  function addAccount() {
    const label = accountLabel.trim();
    const username = accountUsername.trim();
    const secret = accountSecret.trim();

    if (!label || !secret || (accountType === "namecheap" && !username)) {
      showToast("Complete the required test fields first");
      return;
    }

    if (accountType === "cloudflare") {
      setCloudflareAccounts((current) => [
        ...current,
        {
          id: Date.now(),
          type: "cloudflare",
          label,
          detail: "Demo API token · Zone + DNS edit",
        },
      ]);
    } else {
      setNamecheapAccounts((current) => [
        ...current,
        {
          id: `nc-demo-${Date.now()}`,
          label,
          detail: username,
          used: 0,
          limit: 300,
          expiring: 0,
          tone: "violet",
        },
      ]);
    }
    setAccountLabel("");
    setAccountUsername("");
    setAccountSecret("");
    showToast(`${label} added as a demo connection`);
  }

  function deleteNamecheapAccount(id: string) {
    setNamecheapAccounts((current) => current.filter((account) => account.id !== id));
    showToast("Namecheap demo account removed");
  }

  function deleteCloudflareAccount(id: string | number) {
    setCloudflareAccounts((current) =>
      current.filter((account) => account.id !== id),
    );
    showToast("Cloudflare demo account removed");
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

  function normalizeBulkDomains(value: string) {
    return [
      ...new Set(
        value
          .split(/[\s,;]+/)
          .map((item) =>
            item
              .trim()
              .toLowerCase()
              .replace(/^https?:\/\//, "")
              .split("/")[0]
              .replace(/^www\./, ""),
          )
          .filter(Boolean),
      ),
    ];
  }

  function runBulkCheck() {
    const queriedDomains = normalizeBulkDomains(bulkInput);
    if (!queriedDomains.length) {
      showToast("Add at least one test domain to check");
      return;
    }

    const databaseDomains = new Set(domains.map((domain) => domain.name.toLowerCase()));
    const found = queriedDomains.filter((domain) => databaseDomains.has(domain)).length;
    setBulkDomainNames(queriedDomains);
    setBulkResult({
      queried: queriedDomains.length,
      found,
      missing: queriedDomains.length - found,
    });
    setSelected([]);
    showToast(
      `${queriedDomains.length} test ${queriedDomains.length === 1 ? "domain" : "domains"} checked${bulkDbOnly ? " in the local database" : " in demo mode"}`,
    );
  }

  function clearBulkCheck() {
    setBulkInput("");
    setBulkDomainNames([]);
    setBulkResult(null);
    setSelected([]);
  }

  function deleteSelectedFromDatabase() {
    const count = selected.length;
    if (!count) return;
    setDomains((current) => current.filter((domain) => !selected.includes(domain.id)));
    setSelected([]);
    showToast(`${count} demo ${count === 1 ? "domain" : "domains"} removed from the database`);
  }

  function removeSelectedFromCloudflare() {
    const count = selected.length;
    if (!count) return;
    setDomains((current) =>
      current.map((domain) =>
        selected.includes(domain.id)
          ? {
              ...domain,
              status: domain.namecheap === "Not assigned" ? "generated" : "imported",
              cloudflare: null,
              ip: null,
              ns1: null,
              ns2: null,
              error: undefined,
              lastSync: "now",
            }
          : domain,
      ),
    );
    setSelected([]);
    showToast(`${count} demo ${count === 1 ? "zone" : "zones"} removed from Cloudflare`);
  }

  function resetSelectedDomains() {
    const count = selected.length;
    if (!count) return;
    if (resetFromDatabase) {
      setDomains((current) => current.filter((domain) => !selected.includes(domain.id)));
    } else {
      setDomains((current) =>
        current.map((domain) =>
          selected.includes(domain.id)
            ? {
                ...domain,
                status: domain.namecheap === "Not assigned" ? "generated" : "imported",
                cloudflare: null,
                ip: null,
                ns1: null,
                ns2: null,
                error: undefined,
                lastSync: "now",
              }
            : domain,
        ),
      );
    }
    setSelected([]);
    showToast(
      resetFromDatabase
        ? `${count} demo ${count === 1 ? "domain" : "domains"} fully reset and removed`
        : `${count} demo ${count === 1 ? "domain" : "domains"} reset`,
    );
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

  function exportPurchasesCsv() {
    const header = [
      "Date",
      "Buyer",
      "Namecheap account",
      "Server",
      "Domains",
      "Unit price",
      "Total",
    ];
    const lines = purchaseRows.map((row) => [
      row.date,
      row.buyer,
      row.account,
      row.server,
      row.domains,
      row.unitPrice.toFixed(2),
      (row.domains * row.unitPrice).toFixed(2),
    ]);
    const csv = [header, ...lines]
      .map((line) => line.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "domain-purchases-demo.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Test purchase report exported");
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
          <button
            className="button button-ghost purchases-button"
            onClick={() => setPurchasesOpen(true)}
          >
            ▥ Purchases
          </button>
          <button
            className="button balance-button"
            onClick={() => setBalanceOpen((current) => !current)}
            aria-expanded={balanceOpen}
          >
            NC Balance
          </button>
          <button className="avatar" aria-label="Open profile">
            DU
          </button>
          {balanceOpen && (
            <div className="balance-popover" role="status">
              <span className="balance-pulse" />
              <div>
                <strong>Balance: $84.20</strong>
                <small>Namecheap Demo 01 · Withdrawable: $0.00</small>
              </div>
              <button onClick={() => setBalanceOpen(false)}>Got it</button>
            </div>
          )}
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
          {namecheapAccounts.map((account) => {
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
          <button
            className="add-account-card"
            onClick={() =>
              document
                .getElementById("add-account-panel")
                ?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          >
            <span className="plus">+</span>
            <span>
              <strong>Add account</strong>
              <small>Namecheap or Cloudflare</small>
            </span>
          </button>
        </section>

        <section className="quick-tools-grid" aria-label="Domain tools">
          <article className="tool-card">
            <div className="tool-card-heading">
              <span className="tool-icon generator">Aa</span>
              <div>
                <p className="eyebrow">Name ideas</p>
                <h2>Generate domains</h2>
              </div>
              <span className="demo-only">Demo only</span>
            </div>
            <div className="tool-form generator-form">
              <label>
                <span>Generator type</span>
                <select
                  value={generatorType}
                  onChange={(event) => setGeneratorType(event.target.value)}
                >
                  <option value="vowel-consonant">Vowel / consonant</option>
                  <option value="words">Two simple words</option>
                </select>
              </label>
              <div className="tool-form-row">
                <label>
                  <span>TLD</span>
                  <div className="prefix-input">
                    <b>.</b>
                    <input
                      value={generatorTld}
                      onChange={(event) => setGeneratorTld(event.target.value)}
                      placeholder="example"
                    />
                  </div>
                </label>
                <label>
                  <span>Count</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={generatorCount}
                    onChange={(event) => setGeneratorCount(event.target.value)}
                  />
                </label>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={saveGenerated}
                  onChange={(event) => setSaveGenerated(event.target.checked)}
                />
                <span>Add generated names to the workspace</span>
              </label>
              <button className="button button-primary tool-submit" onClick={generateDomains}>
                Generate domains
              </button>
            </div>
          </article>

          <article className="tool-card" id="add-account-panel">
            <div className="tool-card-heading">
              <span className={`tool-icon ${accountType === "cloudflare" ? "cf" : "nc"}`}>
                {accountType === "cloudflare" ? "CF" : "NC"}
              </span>
              <div>
                <p className="eyebrow">Connections</p>
                <h2>Add account</h2>
              </div>
              <span className="demo-only">Test credentials</span>
            </div>
            <div className="account-type-tabs" role="tablist" aria-label="Account type">
              <button
                className={accountType === "cloudflare" ? "active" : ""}
                onClick={() => setAccountType("cloudflare")}
                role="tab"
                aria-selected={accountType === "cloudflare"}
              >
                Cloudflare
              </button>
              <button
                className={accountType === "namecheap" ? "active" : ""}
                onClick={() => setAccountType("namecheap")}
                role="tab"
                aria-selected={accountType === "namecheap"}
              >
                Namecheap
              </button>
            </div>
            <div className="tool-form">
              <label>
                <span>Account label</span>
                <input
                  value={accountLabel}
                  onChange={(event) => setAccountLabel(event.target.value)}
                  placeholder={
                    accountType === "cloudflare"
                      ? "Cloudflare Demo 03"
                      : "Namecheap Demo 04"
                  }
                />
              </label>
              {accountType === "namecheap" && (
                <div className="tool-form-row">
                  <label>
                    <span>API user / username</span>
                    <input
                      value={accountUsername}
                      onChange={(event) => setAccountUsername(event.target.value)}
                      placeholder="demo-nc-user-004"
                    />
                  </label>
                  <label>
                    <span>Whitelisted client IP</span>
                    <input
                      value={accountClientIp}
                      onChange={(event) => setAccountClientIp(event.target.value)}
                      placeholder="192.0.2.50"
                    />
                  </label>
                </div>
              )}
              <label>
                <span>{accountType === "cloudflare" ? "API token" : "API key"}</span>
                <input
                  type="password"
                  value={accountSecret}
                  onChange={(event) => setAccountSecret(event.target.value)}
                  placeholder={
                    accountType === "cloudflare" ? "demo_cf_token_••••" : "demo_nc_key_••••"
                  }
                  autoComplete="new-password"
                />
              </label>
              <div className="credential-note">
                <span>i</span>
                Prototype mode: use test values only. Credentials are not sent anywhere.
              </div>
              <button className="button button-orange tool-submit" onClick={addAccount}>
                Add {accountType === "cloudflare" ? "Cloudflare" : "Namecheap"} account
              </button>
            </div>
          </article>

          <article className="tool-card accounts-tool-card">
            <div className="tool-card-heading">
              <span className="tool-icon accounts-icon">AC</span>
              <div>
                <p className="eyebrow">Connections</p>
                <h2>Accounts</h2>
              </div>
              <button
                className="panel-refresh"
                onClick={() => showToast("Demo account list refreshed")}
              >
                ↻ Refresh
              </button>
            </div>
            <div className="accounts-panel-list">
              {namecheapAccounts.map((account) => (
                <article className="account-list-item" key={account.id}>
                  <span className="account-icon nc">NC</span>
                  <div className="account-list-copy">
                    <strong>{account.label}</strong>
                    <small>{account.detail} · {account.used} domains</small>
                  </div>
                  <span className="connection-status">Connected</span>
                  <div className="account-list-actions">
                    <button
                      onClick={() => showToast(`${account.label} test passed`)}
                    >
                      Test
                    </button>
                    <button
                      className="delete-account"
                      onClick={() => deleteNamecheapAccount(account.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {cloudflareAccounts.map((account) => (
                <article className="account-list-item" key={account.id}>
                  <span className="account-icon cf">CF</span>
                  <div className="account-list-copy">
                    <strong>{account.label}</strong>
                    <small>{account.detail}</small>
                  </div>
                  <span className="connection-status">Connected</span>
                  <div className="account-list-actions">
                    <button
                      onClick={() => showToast(`${account.label} test passed`)}
                    >
                      Test
                    </button>
                    <button
                      className="delete-account"
                      onClick={() => deleteCloudflareAccount(account.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {!namecheapAccounts.length && !cloudflareAccounts.length && (
                <div className="accounts-empty">
                  <strong>No demo accounts</strong>
                  <span>Add a connection using the form on the left.</span>
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="workspace">
          <div className="workspace-header">
            <div>
              <p className="eyebrow">Domain workspace</p>
              <h2>Domains</h2>
              <small className="workspace-count">
                {bulkDomainNames.length
                  ? `${filteredDomains.length} domains · bulk search`
                  : `${filteredDomains.length} of ${domains.length} domains`}
              </small>
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
                <option value="generated">Generated</option>
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

          <section className="selection-panel" aria-label="Bulk domain actions">
            <div className="selection-panel-header">
              <span>
                Selected: <strong>{selected.length}</strong>
              </span>
              <button disabled={!selected.length} onClick={() => setSelected([])}>
                Clear selection
              </button>
            </div>
            <div className="selection-groups">
              <div className="selection-group database-actions">
                <span className="selection-group-title">Database</span>
                <button
                  className="selection-action action-danger"
                  disabled={!selected.length}
                  onClick={deleteSelectedFromDatabase}
                >
                  Delete <span aria-hidden="true">ⓘ</span>
                </button>
              </div>
              <div className="selection-group cloudflare-actions">
                <span className="selection-group-title">Cloudflare</span>
                <div>
                  <button
                    className="selection-action action-purple"
                    disabled={!selected.length}
                    onClick={() => setSetupOpen(true)}
                  >
                    Add <span aria-hidden="true">ⓘ</span>
                  </button>
                  <button
                    className="selection-action action-red"
                    disabled={!selected.length}
                    onClick={removeSelectedFromCloudflare}
                  >
                    Remove <span aria-hidden="true">ⓘ</span>
                  </button>
                  <button
                    className="selection-action action-blue"
                    disabled={!selected.length}
                    onClick={() => {
                      showToast("Choose the new server IP in the setup dialog");
                      setSetupOpen(true);
                    }}
                  >
                    Change IP <span aria-hidden="true">ⓘ</span>
                  </button>
                </div>
              </div>
              <div className="selection-group namecheap-actions">
                <span className="selection-group-title">Namecheap</span>
                <div>
                  <button
                    className="selection-action action-teal"
                    disabled={!selected.length}
                    onClick={() => showToast("Demo nameservers updated for the selection")}
                  >
                    NS servers <span aria-hidden="true">ⓘ</span>
                  </button>
                  <button
                    className="selection-action action-indigo"
                    disabled={!selected.length}
                    onClick={() => showToast("Demo A records updated for the selection")}
                  >
                    A records <span aria-hidden="true">ⓘ</span>
                  </button>
                </div>
              </div>
              <div className="selection-group reset-actions">
                <span className="selection-group-title">Full reset</span>
                <div>
                  <button
                    className="selection-action action-reset"
                    disabled={!selected.length}
                    onClick={resetSelectedDomains}
                  >
                    Reset all <span aria-hidden="true">ⓘ</span>
                  </button>
                  <label className="reset-toggle">
                    <input
                      type="checkbox"
                      checked={resetFromDatabase}
                      onChange={(event) => setResetFromDatabase(event.target.checked)}
                    />
                    <span />
                    from database
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className={`bulk-check-card ${bulkCheckOpen ? "is-open" : ""}`}>
            <button
              className="bulk-check-header"
              onClick={() => setBulkCheckOpen((current) => !current)}
              aria-expanded={bulkCheckOpen}
            >
              <span className="bulk-check-title">
                <span className="bulk-check-dot" />
                NC Bulk Check
                {bulkResult && (
                  <span className="bulk-check-badge">
                    {bulkResult.found}/{bulkResult.queried}
                  </span>
                )}
              </span>
              <span className="bulk-check-chevron" aria-hidden="true">
                {bulkCheckOpen ? "▴" : "▾"}
              </span>
            </button>
            {bulkCheckOpen && (
              <div className="bulk-check-body">
                <textarea
                  value={bulkInput}
                  onChange={(event) => setBulkInput(event.target.value)}
                  placeholder={"alpha-landing.example\nbravo-campaign.example\ncharlie-offer.example"}
                  aria-label="Domains to check"
                  spellCheck={false}
                />
                <div className="bulk-check-controls">
                  <div>
                    <button className="check-namecheap" onClick={runBulkCheck}>
                      <span aria-hidden="true">▶</span> Check Namecheap
                    </button>
                    <button
                      className={`db-only-button ${bulkDbOnly ? "active" : ""}`}
                      onClick={() => setBulkDbOnly((current) => !current)}
                      aria-pressed={bulkDbOnly}
                    >
                      DB only
                    </button>
                    <button className="clear-bulk-button" onClick={clearBulkCheck}>
                      × Clear
                    </button>
                  </div>
                  <span className="auto-detect-note">✧ Account auto-detected per domain</span>
                </div>
                {bulkResult && (
                  <div className="bulk-check-summary">
                    <span>
                      Found: <strong>{bulkResult.found}</strong>
                    </span>
                    <span>
                      Not in DB: <strong>{bulkResult.missing}</strong>
                    </span>
                    <span>of {bulkResult.queried} queried</span>
                  </div>
                )}
              </div>
            )}
          </section>

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
                <button
                  onClick={() => {
                    resetFilters();
                    setBulkDomainNames([]);
                    setBulkResult(null);
                  }}
                >
                  Clear filters
                </button>
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
              {namecheapAccounts.map((account) => (
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
              {cloudflareAccounts.map((connection) => (
                <article key={connection.id}>
                  <span className="account-icon cf">CF</span>
                  <div>
                    <strong>{connection.label}</strong>
                    <small>{connection.detail}</small>
                  </div>
                  <span className="connection-status">Connected</span>
                  <button onClick={() => showToast(`${connection.label} test passed`)}>
                    Test
                  </button>
                </article>
              ))}
            </div>
            <button
              className="add-connection-button"
              onClick={() => {
                setAccountsOpen(false);
                window.setTimeout(
                  () =>
                    document
                      .getElementById("add-account-panel")
                      ?.scrollIntoView({ behavior: "smooth", block: "center" }),
                  50,
                );
              }}
            >
              + Add new connection
            </button>
          </section>
        </div>
      )}

      {purchasesOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="modal purchases-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchases-title"
          >
            <div className="modal-header purchases-header">
              <div>
                <span className="modal-icon purchases-icon">▥</span>
                <div>
                  <p className="eyebrow">Synthetic analytics</p>
                  <h2 id="purchases-title">Domain purchases</h2>
                  <small>Purchased domains by period, buyer, account and server</small>
                </div>
              </div>
              <button
                className="close-button"
                onClick={() => setPurchasesOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="purchase-controls">
              <label>
                <span>From</span>
                <input
                  type="date"
                  value={purchaseFrom}
                  onChange={(event) => setPurchaseFrom(event.target.value)}
                />
              </label>
              <label>
                <span>To</span>
                <input
                  type="date"
                  value={purchaseTo}
                  onChange={(event) => setPurchaseTo(event.target.value)}
                />
              </label>
              <button
                className="button button-primary"
                onClick={() => showToast(`Showing test data from ${purchaseFrom} to ${purchaseTo}`)}
              >
                Show
              </button>
              <div className="period-presets">
                <button
                  onClick={() => {
                    setPurchaseFrom("2026-07-01");
                    setPurchaseTo("2026-07-31");
                  }}
                >
                  This month
                </button>
                <button
                  onClick={() => {
                    setPurchaseFrom("2026-06-01");
                    setPurchaseTo("2026-06-30");
                  }}
                >
                  Last month
                </button>
                <button onClick={() => setPurchaseFrom("2026-07-25")}>7 days</button>
                <button onClick={() => setPurchaseFrom("2026-07-02")}>30 days</button>
              </div>
              <div className="purchase-sync-actions">
                <button onClick={() => showToast("Test server links restored from Cloudflare") }>
                  Restore servers from CF
                </button>
                <button onClick={() => showToast("Test purchase dates refreshed from Namecheap") }>
                  Dates from Namecheap
                </button>
              </div>
            </div>

            <div className="purchase-stats">
              <article>
                <strong>42</strong>
                <span>Domains in period</span>
              </article>
              <article>
                <strong>$112.54</strong>
                <span>Estimated cost</span>
              </article>
              <article>
                <strong>33</strong>
                <span>Assigned to server</span>
              </article>
              <article>
                <strong>3</strong>
                <span>Unique buyers</span>
              </article>
              <article>
                <strong>9</strong>
                <span>Without server</span>
              </article>
            </div>

            <div className="purchase-tabs" role="tablist" aria-label="Purchase report view">
              {[
                ["overview", "Overview"],
                ["buyers", "Buyers"],
                ["servers", "Servers"],
                ["accounts", "NC accounts"],
                ["tld", "TLD"],
                ["details", "Details"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={purchaseTab === value ? "active" : ""}
                  onClick={() => setPurchaseTab(value)}
                  role="tab"
                  aria-selected={purchaseTab === value}
                >
                  {label}
                </button>
              ))}
              <button className="export-csv" onClick={exportPurchasesCsv}>
                ↓ Export CSV
              </button>
            </div>

            <div className="purchase-table-wrap">
              <table className="purchase-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Buyer</th>
                    <th>Namecheap account</th>
                    <th>Server</th>
                    <th>Domains</th>
                    <th>Price/domain</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseRows.map((row, index) => (
                    <tr key={`${row.date}-${index}`}>
                      <td>{row.date}</td>
                      <td>{row.buyer}</td>
                      <td>{row.account}</td>
                      <td className={row.server === "Unassigned" ? "unassigned" : ""}>
                        {row.server}
                      </td>
                      <td><strong>{row.domains}</strong></td>
                      <td>${row.unitPrice.toFixed(2)}</td>
                      <td className="purchase-total">
                        ${(row.domains * row.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4}>Total for selected period</td>
                    <td>42</td>
                    <td />
                    <td>$112.54</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="purchase-demo-note">
              All figures, buyers, accounts and servers in this report are synthetic test data.
            </div>
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
                      <dd className={activeDomain.status === "generated" ? "" : "ok-value"}>
                        {activeDomain.status === "generated" ? "○ Not registered" : "● Active"}
                      </dd>
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
