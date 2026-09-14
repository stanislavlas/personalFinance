import { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { MONTH_SHORT, MONTH_LABELS } from "../../src/utils/theme.js";
import { formatCurrency } from "../../src/utils/enums.js";
import { useTheme } from "../../src/contexts/ThemeContext.js";

export function MonthOverviewScreen({ entries, allEntries, filterMonth, setFilterMonth, household, getCategoryById, colorMap, showPersonalOnly, setTabScrollEnabled, userCurrency }) {
  const { colors: C, styles: S } = useTheme();
  const fmtAmt = (val) => formatCurrency(val, userCurrency || "EUR");

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

  const balColor = totals.balance >= 0 ? C.green : C.red;

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
      {/* Month Overview Header */}
      <View style={{ paddingTop: 20, paddingBottom: 10, alignItems: "center" }}>
        <Text style={{ fontSize: 15, color: C.textTertiary, marginBottom: 6, fontWeight: "600" }}>MONTH OVERVIEW</Text>
        <Text style={{ fontSize: 20, fontWeight: "700", color: C.text }}>{selectedMonthLabel}</Text>
      </View>

      {/* Horizontal month scroller */}
      <View style={{ paddingBottom: 20 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          onTouchStart={() => setTabScrollEnabled?.(false)}
          onTouchEnd={() => setTabScrollEnabled?.(true)}
          onTouchCancel={() => setTabScrollEnabled?.(true)}
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
        <Text style={[S.h1, { fontSize: 42, color: balColor, fontFamily: "Courier" }]}>{fmtAmt(totals.balance)}</Text>
      </View>

      {/* Income / Expense pills */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Income",   val: totals.income,  bg: C.greenLight, color: C.greenDark },
          { label: "Expenses", val: totals.expense, bg: C.redLight,   color: C.redDark  },
        ].map(({ label, val, bg, color }) => (
          <View key={label} style={{ flex: 1, backgroundColor: bg, borderRadius: 14, padding: 14 }}>
            <Text style={{ fontSize: 11, color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color, fontFamily: "Courier" }}>{fmtAmt(val)}</Text>
          </View>
        ))}
      </View>

      {/* Income vs Expense Summary */}
      <View style={{ marginBottom: 24 }}>
        <Text style={S.sectionTitle}>Summary</Text>

        {/* Calculate max for proportional bars */}
        {(() => {
          const maxAmount = Math.max(totals.income, totals.expense, 1);
          const incomePct = (totals.income / maxAmount) * 100;
          const expensePct = (totals.expense / maxAmount) * 100;

          return (
            <>
              {/* Income row */}
              <View style={{ marginBottom: 12 }}>
                <View style={S.rowBetween}>
                  <Text style={[S.body, { flex: 1 }]}>💰 Income</Text>
                  <Text style={{ fontSize: 13, fontFamily: "Courier", color: C.textSecondary }}>{fmtAmt(totals.income)}</Text>
                </View>
                <View style={{ height: 5, borderRadius: 3, backgroundColor: C.bgTertiary, marginTop: 5, overflow: "hidden" }}>
                  <View style={{ height: "100%", borderRadius: 3, width: `${incomePct}%`, backgroundColor: C.green }} />
                </View>
              </View>

              {/* Expense row */}
              <View style={{ marginBottom: 12 }}>
                <View style={S.rowBetween}>
                  <Text style={[S.body, { flex: 1 }]}>💳 Expenses</Text>
                  <Text style={{ fontSize: 13, fontFamily: "Courier", color: C.textSecondary }}>{fmtAmt(totals.expense)}</Text>
                </View>
                <View style={{ height: 5, borderRadius: 3, backgroundColor: C.bgTertiary, marginTop: 5, overflow: "hidden" }}>
                  <View style={{ height: "100%", borderRadius: 3, width: `${expensePct}%`, backgroundColor: C.red }} />
                </View>
              </View>
            </>
          );
        })()}
      </View>

      {/* Necessary vs Optional */}
      {totals.expense > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={S.sectionTitle}>Expense breakdown</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: "#E6F1FB", borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: "#B5D4F4" }}>
              <Text style={{ fontSize: 16, marginBottom: 4 }}>🔒</Text>
              <Text style={{ fontSize: 11, color: "#185FA5", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Necessary</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", fontFamily: "Courier", color: "#185FA5" }}>{fmtAmt(necessityTotals.necessary)}</Text>
              {totals.expense > 0 && (
                <Text style={{ fontSize: 10, color: "#378ADD", marginTop: 2 }}>
                  {Math.round((necessityTotals.necessary / totals.expense) * 100)}%
                </Text>
              )}
            </View>
            <View style={{ flex: 1, backgroundColor: "#FAEEDA", borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: "#FAC775" }}>
              <Text style={{ fontSize: 16, marginBottom: 4 }}>✂️</Text>
              <Text style={{ fontSize: 11, color: "#854F0B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Optional</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", fontFamily: "Courier", color: "#854F0B" }}>{fmtAmt(necessityTotals.optional)}</Text>
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
      {memberBreakdown.length > 0 && !showPersonalOnly && (
        <View style={{ marginBottom: 24 }}>
          <Text style={S.sectionTitle}>By member</Text>
          {memberBreakdown.map(([name, t]) => (
            <View key={name} style={[S.row, { paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: C.border }]}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.greenLight, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: C.greenDark }}>{name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={[S.body, { flex: 1, marginLeft: 10 }]}>{name}</Text>
              <View style={{ alignItems: "flex-end" }}>
                {t.income  > 0 && <Text style={{ fontSize: 12, fontFamily: "Courier", color: C.green }}>+{fmtAmt(t.income)}</Text>}
                {t.expense > 0 && <Text style={{ fontSize: 12, fontFamily: "Courier", color: C.red }}>−{fmtAmt(t.expense)}</Text>}
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
                  <Text style={{ fontSize: 13, fontFamily: "Courier", color: C.textSecondary }}>{fmtAmt(amt)}</Text>
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
    </ScrollView>
  );
}
