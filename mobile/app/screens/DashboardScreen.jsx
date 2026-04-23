import { useMemo, useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { fmt, MONTH_SHORT, MONTH_LABELS } from "../../src/utils/theme.js";
import { useTheme } from "../../src/contexts/ThemeContext.js";

export function DashboardScreen({ entries, allEntries, filterMonth, setFilterMonth, household, getCategoryById, colorMap }) {
  const { colors: C, styles: S } = useTheme();
  const [selectedYear, setSelectedYear] = useState(() => parseInt(filterMonth.slice(0, 4)));

  // Generate list of available years from allEntries
  const availableYears = useMemo(() => {
    const years = new Set();
    allEntries.forEach(e => {
      if (e.date) years.add(parseInt(e.date.slice(0, 4)));
    });
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [allEntries]);

  const totals = useMemo(() => {
    const income  = entries.filter(e => e.type === "income").reduce((s,e)  => s + e.amount, 0);
    const expense = entries.filter(e => e.type === "expense").reduce((s,e) => s + e.amount, 0);
    return { income, expense, balance: income - expense };
  }, [entries]);

  // Necessary vs optional split
  const necessityTotals = useMemo(() => {
    const expenses = entries.filter(e => e.type === "expense");
    const necessary = expenses.filter(e => e.necessity === "necessary" || !e.necessity).reduce((s,e) => s + e.amount, 0);
    const optional  = expenses.filter(e => e.necessity === "optional").reduce((s,e) => s + e.amount, 0);
    return { necessary, optional };
  }, [entries]);

  const catTotals = useMemo(() => {
    const map = {};
    entries.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0, 10);
  }, [entries]);

  const monthlyData = useMemo(() => {
    return MONTH_SHORT.map((m, i) => {
      const key = `${selectedYear}-${String(i+1).padStart(2,"0")}`;
      const inc = allEntries.filter(e => e.date?.startsWith(key) && e.type==="income").reduce((s,e) => s+e.amount, 0);
      const exp = allEntries.filter(e => e.date?.startsWith(key) && e.type==="expense").reduce((s,e) => s+e.amount, 0);
      return { m, inc, exp };
    });
  }, [allEntries, selectedYear]);

  const maxBar      = Math.max(...monthlyData.map(d => Math.max(d.inc, d.exp)), 1);
  const activeMonth = parseInt(filterMonth.slice(5)) - 1;
  const balColor    = totals.balance >= 0 ? C.green : C.red;

  const memberBreakdown = useMemo(() => {
    if (!household) return [];
    const map = {};
    entries.forEach(e => {
      if (!e.authorName) return;
      if (!map[e.authorName]) map[e.authorName] = { income: 0, expense: 0 };
      map[e.authorName][e.type] += e.amount;
    });
    return Object.entries(map);
  }, [entries, household]);

  // Generate months array (36 months back from now)
  const monthsData = useMemo(() => {
    return Array.from({ length: 36 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        key: d.toISOString().slice(0, 7),
        month: d.getMonth(),
        year: d.getFullYear(),
      };
    });
  }, []);

  // Get current selected month label
  const selectedMonthLabel = useMemo(() => {
    const d = new Date(filterMonth + "-01");
    return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
  }, [filterMonth]);

  return (
    <ScrollView style={S.scroll} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

      {/* Selected period header */}
      <View style={{ paddingTop: 20, paddingBottom: 10, alignItems: "center" }}>
        <Text style={{ fontSize: 13, color: C.textTertiary, marginBottom: 6 }}>Selected Period</Text>
        <Text style={{ fontSize: 20, fontWeight: "700", color: C.text }}>{selectedMonthLabel}</Text>
      </View>

      {/* Horizontal month scroller */}
      <View style={{ paddingBottom: 20 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
        >
          {monthsData.map(({ key, month, year }) => {
            const isActive = key === filterMonth;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setFilterMonth(key)}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: isActive ? C.green : C.cardBg,
                  marginHorizontal: 4,
                  borderWidth: 0.5,
                  borderColor: isActive ? C.green : C.border,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: isActive ? "#fff" : C.text, marginBottom: 2 }}>
                  {MONTH_SHORT[month]}
                </Text>
                <Text style={{ fontSize: 11, color: isActive ? "#fff" : C.textTertiary, fontWeight: isActive ? "700" : "400" }}>
                  {year}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Balance */}
      <View style={{ alignItems: "center", paddingVertical: 28 }}>
        <Text style={[S.label, { marginBottom: 6 }]}>Balance</Text>
        <Text style={[S.h1, { fontSize: 42, color: balColor, fontFamily: "Courier" }]}>{fmt(totals.balance)}</Text>
      </View>

      {/* Income / Expense pills */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Income",   val: totals.income,  bg: C.greenLight, color: C.greenDark },
          { label: "Expenses", val: totals.expense, bg: C.redLight,   color: C.redDark  },
        ].map(({ label, val, bg, color }) => (
          <View key={label} style={{ flex: 1, backgroundColor: bg, borderRadius: 14, padding: 14 }}>
            <Text style={{ fontSize: 11, color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color, fontFamily: "Courier" }}>{fmt(val)}</Text>
          </View>
        ))}
      </View>

      {/* Necessary vs Optional */}
      {totals.expense > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={S.sectionTitle}>Expense breakdown</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: "#E6F1FB", borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: "#B5D4F4" }}>
              <Text style={{ fontSize: 16, marginBottom: 4 }}>🔒</Text>
              <Text style={{ fontSize: 11, color: "#185FA5", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Necessary</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", fontFamily: "Courier", color: "#185FA5" }}>{fmt(necessityTotals.necessary)}</Text>
              {totals.expense > 0 && (
                <Text style={{ fontSize: 10, color: "#378ADD", marginTop: 2 }}>
                  {Math.round((necessityTotals.necessary / totals.expense) * 100)}%
                </Text>
              )}
            </View>
            <View style={{ flex: 1, backgroundColor: "#FAEEDA", borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: "#FAC775" }}>
              <Text style={{ fontSize: 16, marginBottom: 4 }}>✂️</Text>
              <Text style={{ fontSize: 11, color: "#854F0B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Optional</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", fontFamily: "Courier", color: "#854F0B" }}>{fmt(necessityTotals.optional)}</Text>
              {totals.expense > 0 && (
                <Text style={{ fontSize: 10, color: "#BA7517", marginTop: 2 }}>
                  {Math.round((necessityTotals.optional / totals.expense) * 100)}%
                </Text>
              )}
            </View>
          </View>
          {/* Progress bar */}
          <View style={{ height: 6, borderRadius: 3, backgroundColor: C.bgTertiary, marginTop: 10, overflow: "hidden", flexDirection: "row" }}>
            <View style={{ flex: necessityTotals.necessary, backgroundColor: C.blue, opacity: 0.8 }} />
            <View style={{ flex: necessityTotals.optional, backgroundColor: C.amber, opacity: 0.8 }} />
          </View>
        </View>
      )}

      {/* Member breakdown */}
      {memberBreakdown.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={S.sectionTitle}>By member</Text>
          {memberBreakdown.map(([name, t]) => (
            <View key={name} style={[S.row, { paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: C.border }]}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.greenLight, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: C.greenDark }}>{name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={[S.body, { flex: 1, marginLeft: 10 }]}>{name}</Text>
              <View style={{ alignItems: "flex-end" }}>
                {t.income  > 0 && <Text style={{ fontSize: 12, fontFamily: "Courier", color: C.green }}>+{fmt(t.income)}</Text>}
                {t.expense > 0 && <Text style={{ fontSize: 12, fontFamily: "Courier", color: C.red }}>−{fmt(t.expense)}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Category bars */}
      {catTotals.length > 0 ? (
        <View style={{ marginBottom: 28 }}>
          <Text style={S.sectionTitle}>By category</Text>
          {catTotals.map(([catId, amt]) => {
            const cat   = getCategoryById(catId);
            const color = colorMap[catId] || "#888";
            const pct   = amt / catTotals[0][1];
            return (
              <View key={catId} style={{ marginBottom: 12 }}>
                <View style={S.rowBetween}>
                  <Text style={[S.body, { flex: 1 }]}>{cat.emoji} {cat.label}</Text>
                  <Text style={{ fontSize: 13, fontFamily: "Courier", color: C.textSecondary }}>{fmt(amt)}</Text>
                </View>
                <View style={{ height: 5, borderRadius: 3, backgroundColor: C.bgTertiary, marginTop: 5, overflow: "hidden" }}>
                  <View style={{ height: "100%", borderRadius: 3, width: `${pct * 100}%`, backgroundColor: color }} />
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={[S.small, { textAlign: "center", paddingVertical: 40 }]}>No transactions this month</Text>
      )}

      {/* Monthly chart */}
      <View style={{ marginBottom: 20 }}>
        {/* Year header */}
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Text style={S.sectionTitle}>Year Overview</Text>
          <Text style={{ fontSize: 18, fontWeight: "700", color: C.text, marginTop: 4 }}>{selectedYear}</Text>
        </View>

        {/* Year horizontal scroller */}
        {availableYears.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4, marginBottom: 12 }}
          >
            {availableYears.map(year => (
              <TouchableOpacity
                key={year}
                onPress={() => setSelectedYear(year)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: year === selectedYear ? C.green : C.cardBg,
                  marginHorizontal: 4,
                  borderWidth: 0.5,
                  borderColor: year === selectedYear ? C.green : C.border,
                }}
              >
                <Text style={{ fontSize: 13, color: year === selectedYear ? "#fff" : C.text, fontWeight: year === selectedYear ? "600" : "400" }}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={{ flexDirection: "row", alignItems: "flex-end", height: 100, marginBottom: 6 }}>
          {monthlyData.map(({ m, inc, exp }, i) => {
            const active = i === activeMonth && selectedYear === parseInt(filterMonth.slice(0, 4));
            const monthKey = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setFilterMonth(monthKey)}
                style={{ flex: 1, alignItems: "center" }}
              >
                <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", width: "90%", gap: 1 }}>
                  <View style={{ flex: 1, backgroundColor: C.green, opacity: active ? 1 : 0.3, borderRadius: 2, height: `${(inc/maxBar)*100}%` }} />
                  <View style={{ flex: 1, backgroundColor: C.red,   opacity: active ? 1 : 0.3, borderRadius: 2, height: `${(exp/maxBar)*100}%` }} />
                </View>
                <Text style={{ fontSize: 7, color: active ? C.text : C.textTertiary, marginTop: 3 }}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={[S.row, { justifyContent: "center", gap: 16 }]}>
          {[{ l:"Income", c: C.green }, { l:"Expenses", c: C.red }].map(({ l, c }) => (
            <View key={l} style={S.row}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: c, marginRight: 5 }} />
              <Text style={{ fontSize: 11, color: C.textTertiary }}>{l}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
