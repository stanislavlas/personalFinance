import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { fmt, MONTH_SHORT } from "../../src/utils/theme.js";
import { useTheme } from "../../src/contexts/ThemeContext.js";

export function YearOverviewScreen({ allEntries, filterMonth }) {
  const { colors: C, styles: S } = useTheme();
  const [selectedYear, setSelectedYear] = useState(() => parseInt(filterMonth.slice(0, 4)));
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => {
    const currentMonth = parseInt(filterMonth.slice(5, 7)) - 1;
    return currentMonth;
  });

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

  // Year totals for year overview
  const yearTotals = useMemo(() => {
    const yearEntries = allEntries.filter(e => e.date?.startsWith(`${selectedYear}-`));
    const income  = yearEntries.filter(e => e.type === "income").reduce((s,e)  => s + e.amount, 0);
    const expense = yearEntries.filter(e => e.type === "expense").reduce((s,e) => s + e.amount, 0);
    return { income, expense, balance: income - expense };
  }, [allEntries, selectedYear]);

  const monthlyData = useMemo(() => {
    return MONTH_SHORT.map((m, i) => {
      const key = `${selectedYear}-${String(i+1).padStart(2,"0")}`;
      const inc = allEntries.filter(e => e.date?.startsWith(key) && e.type==="income").reduce((s,e) => s+e.amount, 0);
      const exp = allEntries.filter(e => e.date?.startsWith(key) && e.type==="expense").reduce((s,e) => s+e.amount, 0);
      return { m, inc, exp };
    });
  }, [allEntries, selectedYear]);

  const maxBar = Math.max(...monthlyData.map(d => Math.max(d.inc, d.exp)), 1);

  // Get selected month details
  const selectedMonthData = useMemo(() => {
    const data = monthlyData[selectedMonthIndex];
    return {
      month: MONTH_SHORT[selectedMonthIndex],
      income: data.inc,
      expense: data.exp,
      balance: data.inc - data.exp
    };
  }, [monthlyData, selectedMonthIndex]);

  return (
    <ScrollView style={S.scroll} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      {/* Year header */}
      <View style={{ alignItems: "center", marginBottom: 16, marginTop: 20, paddingTop: 24 }}>
        <Text style={{ fontSize: 15, color: C.textTertiary, marginBottom: 6, fontWeight: "600" }}>YEAR OVERVIEW</Text>
        <Text style={{ fontSize: 22, fontWeight: "700", color: C.text, marginTop: 4 }}>{selectedYear}</Text>

        {/* Year horizontal scroller - directly under year */}
        {availableYears.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4, marginTop: 12 }}
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
      </View>

      {/* Year totals */}
      <View style={{ alignItems: "center", paddingVertical: 20 }}>
        <Text style={[S.label, { marginBottom: 6 }]}>Annual Balance</Text>
        <Text style={[S.h1, { fontSize: 38, color: yearTotals.balance >= 0 ? C.green : C.red, fontFamily: "Courier" }]}>{fmt(yearTotals.balance)}</Text>
      </View>

      {/* Year Income / Expense pills */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Income",   val: yearTotals.income,  bg: C.greenLight, color: C.greenDark },
          { label: "Expenses", val: yearTotals.expense, bg: C.redLight,   color: C.redDark  },
        ].map(({ label, val, bg, color }) => (
          <View key={label} style={{ flex: 1, backgroundColor: bg, borderRadius: 14, padding: 14 }}>
            <Text style={{ fontSize: 11, color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color, fontFamily: "Courier" }}>{fmt(val)}</Text>
          </View>
        ))}
      </View>

      {/* Year horizontal scroller - removed from here, now under year title */}

      {/* Monthly chart */}
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: 100, marginBottom: 6 }}>
        {monthlyData.map(({ m, inc, exp }, i) => {
          const active = i === selectedMonthIndex && selectedYear === parseInt(filterMonth.slice(0, 4));
          return (
            <TouchableOpacity
              key={m}
              style={{ flex: 1, alignItems: "center" }}
              onPress={() => setSelectedMonthIndex(i)}
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

      {/* Selected month details */}
      <View style={{ marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: C.border }}>
        <Text style={{ fontSize: 13, color: C.textTertiary, textAlign: "center", marginBottom: 8, fontWeight: "600" }}>
          {selectedMonthData.month} {selectedYear}
        </Text>

        {/* Month Balance */}
        <View style={{ alignItems: "center", paddingVertical: 12 }}>
          <Text style={[S.label, { marginBottom: 4, fontSize: 12 }]}>Balance</Text>
          <Text style={{ fontSize: 28, fontWeight: "700", color: selectedMonthData.balance >= 0 ? C.green : C.red, fontFamily: "Courier" }}>
            {fmt(selectedMonthData.balance)}
          </Text>
        </View>

        {/* Month Income / Expense */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: "Income",   val: selectedMonthData.income,  bg: C.greenLight, color: C.greenDark },
            { label: "Expenses", val: selectedMonthData.expense, bg: C.redLight,   color: C.redDark  },
          ].map(({ label, val, bg, color }) => (
            <View key={label} style={{ flex: 1, backgroundColor: bg, borderRadius: 14, padding: 14 }}>
              <Text style={{ fontSize: 11, color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color, fontFamily: "Courier" }}>{fmt(val)}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
