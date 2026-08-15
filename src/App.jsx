import React, { useState, useMemo, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Plus,
  X,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Film,
  Receipt,
  HeartPulse,
  GraduationCap,
  Wallet,
  CreditCard,
  Gift,
  MoreHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  Banknote,
  Pencil,
} from "lucide-react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');`;

const CATEGORIES = {
  makan: { label: "Makanan & Minuman", icon: UtensilsCrossed, type: "keluar" },
  transport: { label: "Transportasi", icon: Car, type: "keluar" },
  belanja: { label: "Belanja", icon: ShoppingBag, type: "keluar" },
  hiburan: { label: "Hiburan", icon: Film, type: "keluar" },
  tagihan: { label: "Tagihan", icon: Receipt, type: "keluar" },
  kesehatan: { label: "Kesehatan", icon: HeartPulse, type: "keluar" },
  pendidikan: { label: "Pendidikan", icon: GraduationCap, type: "keluar" },
  lainnya: { label: "Lainnya", icon: MoreHorizontal, type: "keluar" },
  gaji: { label: "Gaji", icon: Wallet, type: "masuk" },
  bonus: { label: "Bonus / Hadiah", icon: Gift, type: "masuk" },
};

// Metadata tetap (ikon, warna, kelompok) — labelnya bisa diubah pengguna
const ACCOUNT_META = {
  tunai1: { group: "tunai", groupLabel: "Tunai", icon: Banknote, color: "#2F6F63" },
  tunai2: { group: "tunai", groupLabel: "Tunai", icon: Banknote, color: "#3F8577" },
  dompet1: { group: "nontunai", groupLabel: "Non-Tunai", icon: Wallet, color: "#6B7FA3" },
  dompet2: { group: "nontunai", groupLabel: "Non-Tunai", icon: CreditCard, color: "#A3653F" },
};
const ACCOUNT_ORDER = ["tunai1", "tunai2", "dompet1", "dompet2"];
const DEFAULT_WALLET_NAMES = {
  tunai1: "Dompet 1",
  tunai2: "Dompet 2",
  dompet1: "Dompet 1",
  dompet2: "Dompet 2",
};

const PIE_COLORS = ["#C89B3C", "#2F6F63", "#B54B3C", "#6B7FA3", "#8C6E4B", "#7A9B6E", "#A3653F", "#4C6B5E"];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const seedTx = [
  { id: "s1", type: "masuk", category: "gaji", account: "dompet1", amount: 8500000, note: "Gaji bulanan", date: daysAgo(11) },
  { id: "s2", type: "keluar", category: "makan", account: "tunai1", amount: 45000, note: "Nasi padang", date: daysAgo(9) },
  { id: "s3", type: "keluar", category: "transport", account: "dompet2", amount: 25000, note: "Ojek online", date: daysAgo(9) },
  { id: "s4", type: "keluar", category: "tagihan", account: "dompet1", amount: 350000, note: "Listrik & internet", date: daysAgo(7) },
  { id: "s5", type: "transfer", fromAccount: "dompet1", toAccount: "tunai1", amount: 500000, note: "Tarik tunai ATM", date: daysAgo(6) },
  { id: "s6", type: "keluar", category: "belanja", account: "tunai2", amount: 210000, note: "Kebutuhan bulanan", date: daysAgo(5) },
  { id: "s7", type: "keluar", category: "hiburan", account: "dompet2", amount: 60000, note: "Nonton bioskop", date: daysAgo(3) },
  { id: "s8", type: "keluar", category: "makan", account: "tunai1", amount: 32000, note: "Kopi & camilan", date: daysAgo(1) },
];

function formatIDR(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatTanggal(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function App() {
  const [tx, setTx] = useState(seedTx);
  const [walletNames, setWalletNames] = useState(DEFAULT_WALLET_NAMES);
  const [loaded, setLoaded] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [formOpen, setFormOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [formType, setFormType] = useState("keluar"); // 'keluar' | 'masuk' | 'transfer'
  const [amountStr, setAmountStr] = useState("");
  const [category, setCategory] = useState("makan");
  const [account, setAccount] = useState("tunai1");
  const [fromAccount, setFromAccount] = useState("dompet1");
  const [toAccount, setToAccount] = useState("tunai1");
  const [note, setNote] = useState("");
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const didInitTx = useRef(false);
  const didInitNames = useRef(false);

  // Gabungan metadata akun + nama yang bisa diubah pengguna
  const ACCOUNTS = useMemo(() => {
    const out = {};
    ACCOUNT_ORDER.forEach((key) => {
      out[key] = { ...ACCOUNT_META[key], label: walletNames[key], short: walletNames[key] };
    });
    return out;
  }, [walletNames]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("buku-kas:transaksi");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) setTx(parsed);
      }
    } catch (e) {
      // belum ada data tersimpan
    }
    try {
      const raw2 = localStorage.getItem("buku-kas:nama-dompet");
      if (raw2) {
        const parsed2 = JSON.parse(raw2);
        if (parsed2 && typeof parsed2 === "object") setWalletNames((prev) => ({ ...prev, ...parsed2 }));
      }
    } catch (e) {
      // belum ada nama kustom tersimpan
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!didInitTx.current) {
      didInitTx.current = true;
      return;
    }
    localStorage.setItem("buku-kas:transaksi", JSON.stringify(tx));
  }, [tx, loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (!didInitNames.current) {
      didInitNames.current = true;
      return;
    }
    localStorage.setItem("buku-kas:nama-dompet", JSON.stringify(walletNames));
  }, [walletNames, loaded]);

  const monthTx = useMemo(() => {
    return tx
      .filter((t) => {
        const d = new Date(t.date + "T00:00:00");
        return d.getFullYear() === cursor.y && d.getMonth() === cursor.m;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [tx, cursor]);

  const totals = useMemo(() => {
    let masuk = 0, keluar = 0;
    monthTx.forEach((t) => {
      if (t.type === "masuk") masuk += t.amount;
      if (t.type === "keluar") keluar += t.amount;
    });
    return { masuk, keluar, saldo: masuk - keluar };
  }, [monthTx]);

  // saldo per akun dihitung dari SELURUH riwayat, bukan hanya bulan berjalan
  const saldoByAccount = useMemo(() => {
    const s = { tunai1: 0, tunai2: 0, dompet1: 0, dompet2: 0 };
    tx.forEach((t) => {
      if (t.type === "masuk") s[t.account] += t.amount;
      else if (t.type === "keluar") s[t.account] -= t.amount;
      else if (t.type === "transfer") {
        s[t.fromAccount] -= t.amount;
        s[t.toAccount] += t.amount;
      }
    });
    return s;
  }, [tx]);

  const saldoTunai = saldoByAccount.tunai1 + saldoByAccount.tunai2;
  const saldoNonTunai = saldoByAccount.dompet1 + saldoByAccount.dompet2;
  const overallSaldo = saldoTunai + saldoNonTunai;

  const pieData = useMemo(() => {
    const byCat = {};
    monthTx.forEach((t) => {
      if (t.type !== "keluar") return;
      byCat[t.category] = (byCat[t.category] || 0) + t.amount;
    });
    return Object.entries(byCat)
      .map(([key, value]) => ({ key, name: CATEGORIES[key]?.label || key, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthTx]);

  const grouped = useMemo(() => {
    const g = {};
    monthTx.forEach((t) => {
      g[t.date] = g[t.date] || [];
      g[t.date].push(t);
    });
    return Object.entries(g);
  }, [monthTx]);

  function openForm(type) {
    setFormType(type);
    if (type === "keluar") setCategory("makan");
    if (type === "masuk") setCategory("gaji");
    if (type === "transfer") {
      setFromAccount("dompet1");
      setToAccount("tunai1");
    }
    setFormOpen(true);
  }

  function addTx(e) {
    e.preventDefault();
    const num = Number(amountStr.replace(/[^\d]/g, ""));
    if (!num) return;

    if (formType === "transfer") {
      if (fromAccount === toAccount) return;
      const newTx = {
        id: String(Date.now()),
        type: "transfer",
        fromAccount,
        toAccount,
        amount: num,
        note: note.trim(),
        date: dateStr,
      };
      setTx((prev) => [newTx, ...prev]);
    } else {
      const newTx = {
        id: String(Date.now()),
        type: formType,
        category,
        account,
        amount: num,
        note: note.trim(),
        date: dateStr,
      };
      setTx((prev) => [newTx, ...prev]);
    }
    setAmountStr("");
    setNote("");
    setFormOpen(false);
  }

  function removeTx(id) {
    setTx((prev) => prev.filter((t) => t.id !== id));
  }

  function shiftMonth(delta) {
    setCursor((c) => {
      let m = c.m + delta;
      let y = c.y;
      if (m < 0) { m = 11; y -= 1; }
      if (m > 11) { m = 0; y += 1; }
      return { y, m };
    });
  }

  function renameWallet(key, value) {
    setWalletNames((prev) => ({ ...prev, [key]: value }));
  }

  const availableCats = Object.entries(CATEGORIES).filter(([, v]) => v.type === formType);

  // Selector akun terkelompok, dipakai di form pengeluaran/pemasukan dan perpindahan
  function AccountPicker({ value, onChange, disabledKey }) {
    return (
      <div style={styles.pickerGroupWrap}>
        {["tunai", "nontunai"].map((groupKey) => (
          <div key={groupKey} style={styles.pickerGroup}>
            <div style={styles.pickerGroupLabel}>
              {groupKey === "tunai" ? "Tunai" : "Non-Tunai"}
            </div>
            <div style={styles.catGrid}>
              {ACCOUNT_ORDER.filter((k) => ACCOUNT_META[k].group === groupKey).map((key) => {
                const v = ACCOUNTS[key];
                const Icon = v.icon;
                const disabled = key === disabledKey;
                return (
                  <button
                    type="button"
                    key={key}
                    disabled={disabled}
                    onClick={() => onChange(key)}
                    style={{
                      ...styles.catChip,
                      ...(value === key ? styles.catChipActive : {}),
                      ...(disabled ? styles.catChipDisabled : {}),
                    }}
                  >
                    <Icon size={15} /> {v.short}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <style>{FONT_IMPORT}</style>

      {/* ---------- HERO ---------- */}
      <div style={styles.hero}>
        <div style={styles.heroTop}>
          <span style={styles.heroEyebrow}>BUKU KAS PRIBADI</span>
          <div style={styles.heroTopRight}>
            <button style={styles.editWalletsBtn} onClick={() => setRenameOpen(true)}>
              <Pencil size={13} /> Nama Dompet
            </button>
            <div style={styles.monthNav}>
              <button style={styles.monthBtn} onClick={() => shiftMonth(-1)} aria-label="Bulan sebelumnya">
                <ChevronLeft size={16} />
              </button>
              <span style={styles.monthLabel}>{MONTH_NAMES[cursor.m]} {cursor.y}</span>
              <button style={styles.monthBtn} onClick={() => shiftMonth(1)} aria-label="Bulan berikutnya">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Passbook-style ledger card */}
        <div style={styles.passbook}>
          <div style={styles.passbookBody}>
            <div style={styles.saldoLabel}>Saldo Keseluruhan</div>
            <div style={styles.saldoValue}>{formatIDR(overallSaldo)}</div>

            <div style={styles.accountSplit}>
              {["tunai", "nontunai"].map((groupKey) => (
                <div key={groupKey} style={{ ...styles.accountCard, ...styles.accountCardGroup }}>
                  <div style={styles.accountCardHead}>
                    {groupKey === "tunai" ? (
                      <Banknote size={15} color="#5B6B62" />
                    ) : (
                      <CreditCard size={15} color="#5B6B62" />
                    )}
                    <span>{groupKey === "tunai" ? "Tunai" : "Non-Tunai"}</span>
                    <span style={styles.accountGroupTotal}>
                      {formatIDR(groupKey === "tunai" ? saldoTunai : saldoNonTunai)}
                    </span>
                  </div>
                  <div style={styles.subWalletRow}>
                    {ACCOUNT_ORDER.filter((k) => ACCOUNT_META[k].group === groupKey).map((key) => {
                      const v = ACCOUNTS[key];
                      const Icon = v.icon;
                      return (
                        <div key={key} style={styles.subWallet}>
                          <div style={styles.subWalletLabel}>
                            <Icon size={12} color={v.color} /> {v.short}
                          </div>
                          <div style={{ ...styles.subWalletValue, color: v.color }}>
                            {formatIDR(saldoByAccount[key])}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.passbookDivider} />
            <div style={styles.passbookRow}>
              <div>
                <div style={styles.miniLabel}>Pemasukan bulan ini</div>
                <div style={{ ...styles.miniValue, color: "#2F6F63" }}>{formatIDR(totals.masuk)}</div>
              </div>
              <div>
                <div style={styles.miniLabel}>Pengeluaran bulan ini</div>
                <div style={{ ...styles.miniValue, color: "#B54B3C" }}>{formatIDR(totals.keluar)}</div>
              </div>
            </div>
          </div>
          <div style={styles.stamp}>
            <div style={styles.stampRing}>
              <span style={styles.stampText}>LUNAS</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- QUICK ADD ---------- */}
      <div style={styles.quickAddBar}>
        <button style={{ ...styles.quickBtn, background: "#B54B3C", boxShadow: "0 10px 24px -10px rgba(181,75,60,0.55)" }} onClick={() => openForm("keluar")}>
          <Plus size={17} /> Pengeluaran
        </button>
        <button style={{ ...styles.quickBtn, background: "#2F6F63", boxShadow: "0 10px 24px -10px rgba(47,111,99,0.55)" }} onClick={() => openForm("masuk")}>
          <Plus size={17} /> Pemasukan
        </button>
        <button style={{ ...styles.quickBtn, background: "#16241F", boxShadow: "0 10px 24px -10px rgba(22,36,31,0.45)" }} onClick={() => openForm("transfer")}>
          <ArrowRightLeft size={16} /> Pindah
        </button>
      </div>

      {/* ---------- RENAME MODAL ---------- */}
      {renameOpen && (
        <div style={styles.modalOverlay} onClick={() => setRenameOpen(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Nama Dompet</span>
              <button type="button" style={styles.closeBtn} onClick={() => setRenameOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.pickerGroupLabel}>Tunai</div>
            {["tunai1", "tunai2"].map((key) => (
              <input
                key={key}
                style={styles.textInput}
                value={walletNames[key]}
                onChange={(e) => renameWallet(key, e.target.value)}
                placeholder={DEFAULT_WALLET_NAMES[key]}
              />
            ))}

            <div style={{ ...styles.pickerGroupLabel, marginTop: 14 }}>Non-Tunai</div>
            {["dompet1", "dompet2"].map((key) => (
              <input
                key={key}
                style={styles.textInput}
                value={walletNames[key]}
                onChange={(e) => renameWallet(key, e.target.value)}
                placeholder={DEFAULT_WALLET_NAMES[key]}
              />
            ))}

            <button type="button" style={styles.submitBtn} onClick={() => setRenameOpen(false)}>
              Selesai
            </button>
          </div>
        </div>
      )}

      {/* ---------- FORM MODAL ---------- */}
      {formOpen && (
        <div style={styles.modalOverlay} onClick={() => setFormOpen(false)}>
          <form style={styles.modalCard} onClick={(e) => e.stopPropagation()} onSubmit={addTx}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>
                {formType === "keluar" && "Catat Pengeluaran"}
                {formType === "masuk" && "Catat Pemasukan"}
                {formType === "transfer" && "Catat Perpindahan Saldo"}
              </span>
              <button type="button" style={styles.closeBtn} onClick={() => setFormOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <label style={styles.label}>Jumlah (Rp)</label>
            <input
              style={styles.amountInput}
              inputMode="numeric"
              placeholder="0"
              value={amountStr ? Number(amountStr.replace(/[^\d]/g, "")).toLocaleString("id-ID") : ""}
              onChange={(e) => setAmountStr(e.target.value)}
              autoFocus
            />

            {formType === "transfer" ? (
              <>
                <label style={styles.label}>Dari Dompet</label>
                <AccountPicker value={fromAccount} onChange={setFromAccount} />

                <label style={styles.label}>Ke Dompet</label>
                <AccountPicker value={toAccount} onChange={setToAccount} disabledKey={fromAccount} />

                {fromAccount === toAccount && (
                  <div style={styles.warnText}>Pilih dua dompet yang berbeda.</div>
                )}
              </>
            ) : (
              <>
                <label style={styles.label}>Kategori</label>
                <div style={styles.catGrid}>
                  {availableCats.map(([key, v]) => {
                    const Icon = v.icon;
                    const active = key === category;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setCategory(key)}
                        style={{ ...styles.catChip, ...(active ? styles.catChipActive : {}) }}
                      >
                        <Icon size={15} />
                        {v.label}
                      </button>
                    );
                  })}
                </div>

                <label style={styles.label}>
                  {formType === "keluar" ? "Sumber dana (dibayar dari)" : "Masuk ke dompet"}
                </label>
                <AccountPicker value={account} onChange={setAccount} />
              </>
            )}

            <label style={styles.label}>Catatan (opsional)</label>
            <input
              style={styles.textInput}
              placeholder={formType === "transfer" ? "mis. Tarik tunai ATM" : "mis. Makan siang bersama tim"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <label style={styles.label}>Tanggal</label>
            <input
              type="date"
              style={styles.textInput}
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />

            <button
              type="submit"
              style={styles.submitBtn}
              disabled={formType === "transfer" && fromAccount === toAccount}
            >
              Simpan Transaksi
            </button>
          </form>
        </div>
      )}

      {/* ---------- CONTENT GRID ---------- */}
      <div style={styles.grid}>
        {/* Category breakdown */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Rincian Pengeluaran per Kategori</div>
          {pieData.length === 0 ? (
            <div style={styles.emptyState}>Belum ada pengeluaran bulan ini.</div>
          ) : (
            <>
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={82}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={entry.key} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatIDR(v)} contentStyle={styles.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={styles.legendList}>
                {pieData.map((entry, i) => (
                  <div key={entry.key} style={styles.legendRow}>
                    <span style={{ ...styles.legendDot, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span style={styles.legendName}>{entry.name}</span>
                    <span style={styles.legendValue}>{formatIDR(entry.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Transaction list */}
        <div style={{ ...styles.card, ...styles.receiptCard }}>
          <div style={styles.receiptPerfTop} />
          <div style={styles.cardTitle}>Riwayat Transaksi</div>
          {grouped.length === 0 ? (
            <div style={styles.emptyState}>Belum ada transaksi di {MONTH_NAMES[cursor.m]} {cursor.y}.</div>
          ) : (
            <div style={styles.txList}>
              {grouped.map(([date, items]) => (
                <div key={date}>
                  <div style={styles.dateHeading}>{formatTanggal(date)}</div>
                  {items.map((t) => {
                    if (t.type === "transfer") {
                      return (
                        <div key={t.id} style={styles.txRow}>
                          <div style={{ ...styles.txIcon, background: "#EFE9D8" }}>
                            <ArrowRightLeft size={16} color="#8A7B3F" />
                          </div>
                          <div style={styles.txMain}>
                            <div style={styles.txNote}>{t.note || "Perpindahan saldo"}</div>
                            <div style={styles.txCat}>
                              {ACCOUNTS[t.fromAccount].short} &rarr; {ACCOUNTS[t.toAccount].short}
                            </div>
                          </div>
                          <div style={{ ...styles.txAmount, color: "#8A7B3F" }}>
                            {formatIDR(t.amount)}
                          </div>
                          <button style={styles.deleteBtn} onClick={() => removeTx(t.id)} aria-label="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    }
                    const cat = CATEGORIES[t.category];
                    const Icon = cat?.icon || MoreHorizontal;
                    return (
                      <div key={t.id} style={styles.txRow}>
                        <div style={{ ...styles.txIcon, background: t.type === "masuk" ? "#E4EEE8" : "#F3E7E1" }}>
                          <Icon size={16} color={t.type === "masuk" ? "#2F6F63" : "#B54B3C"} />
                        </div>
                        <div style={styles.txMain}>
                          <div style={styles.txNote}>{t.note || cat?.label || "Transaksi"}</div>
                          <div style={styles.txCat}>
                            {cat?.label} &middot; {ACCOUNTS[t.account]?.short}
                          </div>
                        </div>
                        <div style={{ ...styles.txAmount, color: t.type === "masuk" ? "#2F6F63" : "#B54B3C" }}>
                          {t.type === "masuk" ? "+" : "-"}{formatIDR(t.amount)}
                        </div>
                        <button style={styles.deleteBtn} onClick={() => removeTx(t.id)} aria-label="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          <div style={styles.receiptPerfBottom} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  app: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    background: "#F1ECDD",
    minHeight: "100vh",
    color: "#1B2420",
    paddingBottom: 40,
  },
  hero: {
    background: "linear-gradient(160deg, #0F2A28 0%, #163B36 100%)",
    padding: "28px 20px 64px",
    borderRadius: "0 0 28px 28px",
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    maxWidth: 720,
    margin: "0 auto 18px",
    flexWrap: "wrap",
    gap: 10,
  },
  heroEyebrow: {
    color: "#C89B3C",
    fontSize: 12,
    letterSpacing: "0.14em",
    fontWeight: 600,
  },
  heroTopRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  editWalletsBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(255,255,255,0.08)",
    border: "none",
    borderRadius: 999,
    padding: "7px 12px",
    color: "#F1ECDD",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  monthNav: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    padding: "4px 6px",
  },
  monthBtn: {
    background: "transparent",
    border: "none",
    color: "#F1ECDD",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: 4,
  },
  monthLabel: {
    color: "#F1ECDD",
    fontSize: 13,
    fontWeight: 600,
    minWidth: 108,
    textAlign: "center",
  },
  passbook: {
    maxWidth: 720,
    margin: "0 auto",
    background: "#FBF8F1",
    borderRadius: 20,
    position: "relative",
    boxShadow: "0 20px 40px -18px rgba(15,42,40,0.55)",
    overflow: "hidden",
  },
  passbookBody: {
    padding: "22px 26px 26px",
    position: "relative",
    zIndex: 1,
  },
  saldoLabel: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 12.5,
    color: "#5B6B62",
    fontWeight: 600,
    letterSpacing: "0.02em",
  },
  saldoValue: {
    fontFamily: "'Fraunces', serif",
    fontSize: 40,
    fontWeight: 600,
    marginTop: 4,
    color: "#16241F",
    letterSpacing: "-0.01em",
  },
  accountSplit: {
    display: "flex",
    gap: 10,
    marginTop: 16,
    flexWrap: "wrap",
  },
  accountCard: {
    flex: "1 1 220px",
    background: "#F1ECDD",
    borderRadius: 12,
    padding: "10px 12px",
  },
  accountCardGroup: {},
  accountCardHead: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11.5,
    fontWeight: 600,
    color: "#5B6B62",
  },
  accountGroupTotal: {
    marginLeft: "auto",
    fontFamily: "'Space Grotesk', monospace",
    fontSize: 12.5,
    color: "#16241F",
    fontWeight: 600,
  },
  subWalletRow: {
    display: "flex",
    gap: 10,
    marginTop: 8,
  },
  subWallet: {
    flex: 1,
    minWidth: 0,
  },
  subWalletLabel: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 10.5,
    color: "#5B6B62",
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  subWalletValue: {
    fontFamily: "'Space Grotesk', monospace",
    fontSize: 13,
    fontWeight: 600,
    marginTop: 2,
  },
  passbookDivider: {
    borderTop: "1px dashed #C9BFA0",
    margin: "18px 0 16px",
  },
  passbookRow: {
    display: "flex",
    gap: 32,
    flexWrap: "wrap",
  },
  miniLabel: {
    fontSize: 11.5,
    color: "#5B6B62",
    fontWeight: 600,
  },
  miniValue: {
    fontFamily: "'Space Grotesk', monospace",
    fontSize: 18,
    fontWeight: 600,
    marginTop: 2,
  },
  stamp: {
    position: "absolute",
    right: 22,
    top: 20,
    opacity: 0.9,
  },
  stampRing: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    border: "2px solid #B54B3C",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transform: "rotate(-14deg)",
  },
  stampText: {
    color: "#B54B3C",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
  },
  quickAddBar: {
    maxWidth: 720,
    margin: "-30px auto 0",
    display: "flex",
    gap: 10,
    padding: "0 20px",
    position: "relative",
    zIndex: 2,
  },
  quickBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    color: "#FBF8F1",
    border: "none",
    borderRadius: 14,
    padding: "14px 10px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,26,24,0.5)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 50,
  },
  modalCard: {
    background: "#FBF8F1",
    width: "100%",
    maxWidth: 480,
    borderRadius: "24px 24px 0 0",
    padding: "20px 22px 26px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    maxHeight: "88vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 20,
    fontWeight: 600,
  },
  closeBtn: {
    background: "#EFE9D8",
    border: "none",
    borderRadius: 999,
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#1B2420",
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#5B6B62",
    marginTop: 14,
    marginBottom: 6,
  },
  amountInput: {
    fontFamily: "'Space Grotesk', monospace",
    fontSize: 28,
    fontWeight: 600,
    border: "none",
    borderBottom: "2px solid #C9BFA0",
    background: "transparent",
    padding: "6px 2px",
    outline: "none",
    color: "#16241F",
  },
  pickerGroupWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  pickerGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  pickerGroupLabel: {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "#A79B78",
  },
  catGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  catChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: "1.5px solid #DDD4BB",
    background: "#FFFDF7",
    borderRadius: 999,
    padding: "7px 12px",
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer",
    color: "#1B2420",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  catChipActive: {
    background: "#16241F",
    borderColor: "#16241F",
    color: "#FBF8F1",
  },
  catChipDisabled: {
    opacity: 0.35,
    cursor: "not-allowed",
  },
  warnText: {
    fontSize: 12,
    color: "#B54B3C",
    marginTop: 6,
  },
  textInput: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    border: "1.5px solid #DDD4BB",
    borderRadius: 10,
    padding: "10px 12px",
    outline: "none",
    background: "#FFFDF7",
    color: "#1B2420",
    marginBottom: 2,
  },
  submitBtn: {
    marginTop: 16,
    background: "#16241F",
    color: "#FBF8F1",
    border: "none",
    borderRadius: 12,
    padding: "14px",
    fontSize: 14.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  grid: {
    maxWidth: 720,
    margin: "26px auto 0",
    padding: "0 20px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  card: {
    background: "#FFFDF7",
    borderRadius: 18,
    padding: "20px 20px 8px",
    border: "1px solid #E7DFC8",
  },
  cardTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 17,
    fontWeight: 600,
    marginBottom: 14,
    color: "#16241F",
  },
  tooltip: {
    background: "#16241F",
    border: "none",
    borderRadius: 8,
    color: "#FBF8F1",
    fontSize: 12,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  legendList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "12px 2px 16px",
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    flexShrink: 0,
  },
  legendName: {
    flex: 1,
    color: "#3B463F",
    fontWeight: 500,
  },
  legendValue: {
    fontFamily: "'Space Grotesk', monospace",
    fontWeight: 600,
    color: "#16241F",
  },
  receiptCard: {
    position: "relative",
    paddingBottom: 20,
  },
  receiptPerfTop: {
    position: "absolute",
    top: -1,
    left: 0,
    right: 0,
    height: 8,
    backgroundImage: "radial-gradient(circle, #F1ECDD 4px, transparent 4.2px)",
    backgroundSize: "16px 8px",
    backgroundRepeat: "repeat-x",
  },
  receiptPerfBottom: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 8,
    backgroundImage: "radial-gradient(circle, #F1ECDD 4px, transparent 4.2px)",
    backgroundSize: "16px 8px",
    backgroundRepeat: "repeat-x",
  },
  emptyState: {
    fontSize: 13,
    color: "#8A8264",
    padding: "10px 0 20px",
  },
  txList: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  dateHeading: {
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#8A8264",
    margin: "14px 0 6px",
  },
  txRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 0",
    borderBottom: "1px dashed #EEE7D2",
  },
  txIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  txMain: {
    flex: 1,
    minWidth: 0,
  },
  txNote: {
    fontSize: 13.5,
    fontWeight: 600,
    color: "#16241F",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  txCat: {
    fontSize: 11.5,
    color: "#8A8264",
  },
  txAmount: {
    fontFamily: "'Space Grotesk', monospace",
    fontSize: 13.5,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    color: "#C9BFA0",
    cursor: "pointer",
    padding: 4,
    display: "flex",
  },
};
