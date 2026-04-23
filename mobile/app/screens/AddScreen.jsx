import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useTheme } from "../../src/contexts/ThemeContext.js";
import { toApiTransactionType, toApiNecessity } from "../../src/utils/enums.js";

export function AddScreen({ onAdd, authorName, currency = "EUR", incomeCategories, expenseCategories, colorMap }) {
  const { colors: C, styles: S } = useTheme();
  const [type, setType]         = useState("expense");
  const [amount, setAmount]     = useState("");
  const [category, setCategory] = useState(() => expenseCategories[0]?.id || expenseCategories[0]?.categoryId || "");
  const [necessity, setNecessity] = useState("necessary"); // "necessary" | "optional"
  const [note, setNote]         = useState("");
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => new Date(date + "T00:00:00"));
  const [saving, setSaving]     = useState(false);
  const [flash, setFlash]       = useState(null);

  const cats = type === "income" ? incomeCategories : expenseCategories;

  function switchType(t) {
    setType(t);
    const first = t === "income" ? incomeCategories[0] : expenseCategories[0];
    setCategory(first?.id || first?.categoryId || "");
  }

  async function handleSubmit() {
    const amt = parseFloat(amount.replace(",", "."));
    if (!amt || amt <= 0) { setFlash({ ok: false, msg: "Enter a valid amount" }); return; }
    if (!category) { setFlash({ ok: false, msg: "Please select a category" }); return; }
    setSaving(true);
    try {
      await onAdd({
        type:      toApiTransactionType(type),
        amount:    { value: amt, currency },
        categoryId: category,
        necessity: toApiNecessity(necessity),
        note:      note.trim() || "",
        name:      note.trim() || "Transaction",
        date,
      });
      setAmount(""); setNote("");
      setFlash({ ok: true, msg: "✓ Saved" });
      setTimeout(() => setFlash(null), 1800);
    } catch (e) {
      setFlash({ ok: false, msg: e.message || "Failed to save" });
    } finally { setSaving(false); }
  }

  const accent      = type === "income" ? C.green : C.red;
  const accentLight = type === "income" ? C.greenLight : C.redLight;

  return (
    <KeyboardAvoidingView style={S.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type toggle */}
        <View style={[S.row, { gap: 8, marginBottom: 22 }]}>
          {["expense", "income"].map(t => (
            <TouchableOpacity
              key={t} onPress={() => switchType(t)}
              style={[{
                flex: 1,
                paddingVertical: 13,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: type === t ? (t === "income" ? C.green : C.red) : C.border,
                backgroundColor: type === t ? (t === "income" ? C.greenLight : C.redLight) : C.bgSecondary,
                alignItems: "center",
              }]}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: type === t ? "700" : "400",
                color: type === t ? (t === "income" ? C.greenDark : C.redDark) : C.textTertiary,
              }}>
                {t === "income" ? "💰 Income" : "💸 Expense"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <Text style={[S.label, { marginBottom: 6 }]}>Amount (EUR)</Text>
        <TextInput
          style={[S.input, { fontSize: 32, fontFamily: "Courier", fontWeight: "700", textAlign: "center", borderColor: accent }]}
          placeholder="0.00" placeholderTextColor={C.textTertiary}
          value={amount} onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        {/* Necessity toggle — expense only */}
        {type === "expense" && (
          <>
            <Text style={[S.label, { marginBottom: 8 }]}>Type</Text>
            <View style={[S.row, { gap: 8, marginBottom: 20 }]}>
              <TouchableOpacity
                onPress={() => setNecessity("necessary")}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: necessity === "necessary" ? C.blue : C.border,
                  backgroundColor: necessity === "necessary" ? "#E6F1FB" : C.bgSecondary,
                }}
              >
                <Text style={{ fontSize: 20 }}>🔒</Text>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: necessity === "necessary" ? "700" : "500", color: necessity === "necessary" ? "#185FA5" : C.text }}>
                    Necessary
                  </Text>
                  <Text style={{ fontSize: 11, color: C.textTertiary, marginTop: 1 }}>Can't cut this</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setNecessity("optional")}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: necessity === "optional" ? C.amber : C.border,
                  backgroundColor: necessity === "optional" ? "#FAEEDA" : C.bgSecondary,
                }}
              >
                <Text style={{ fontSize: 20 }}>✂️</Text>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: necessity === "optional" ? "700" : "500", color: necessity === "optional" ? "#854F0B" : C.text }}>
                    Optional
                  </Text>
                  <Text style={{ fontSize: 11, color: C.textTertiary, marginTop: 1 }}>Could save here</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Category */}
        <Text style={[S.label, { marginBottom: 8 }]}>Category</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {cats.map(cat => {
            const catId  = cat.id || cat.categoryId;
            const active = category === catId;
            const color  = colorMap[catId] || C.textSecondary;
            return (
              <TouchableOpacity
                key={catId} onPress={() => setCategory(catId)}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 7,
                  borderRadius: 20,
                  borderWidth: 0.5,
                  borderColor: active ? color : C.border,
                  backgroundColor: active ? color + "20" : C.bgSecondary,
                }}
              >
                <Text style={{ fontSize: 13, color: active ? color : C.textSecondary, fontWeight: active ? "600" : "400" }}>
                  {cat.emoji} {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Note */}
        <Text style={[S.label, { marginBottom: 6 }]}>Note (optional)</Text>
        <TextInput
          style={S.input} placeholder="What was it for?"
          placeholderTextColor={C.textTertiary} value={note} onChangeText={setNote}
        />

        {/* Date picker */}
        <Text style={[S.label, { marginTop: 18, marginBottom: 6 }]}>Date</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(!showDatePicker)}
          style={{
            backgroundColor: C.cardBg,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 10,
            padding: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 15, color: C.text }}>
            {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </Text>
          <Text style={{ fontSize: 16, color: C.textTertiary }}>📅</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <View style={{ marginTop: 12, backgroundColor: C.cardBg, borderRadius: 10, padding: 16, borderWidth: 0.5, borderColor: C.border }}>
            {/* Month/Year header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => {
                  const prev = new Date(pickerMonth);
                  prev.setMonth(prev.getMonth() - 1);
                  setPickerMonth(prev);
                }}
                style={{ padding: 8 }}
              >
                <Text style={{ fontSize: 18, color: C.text }}>‹</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 15, fontWeight: "600", color: C.text }}>
                {pickerMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const next = new Date(pickerMonth);
                  next.setMonth(next.getMonth() + 1);
                  setPickerMonth(next);
                }}
                style={{ padding: 8 }}
              >
                <Text style={{ fontSize: 18, color: C.text }}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Weekday labels */}
            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <View key={i} style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: C.textTertiary }}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            {(() => {
              const year = pickerMonth.getFullYear();
              const month = pickerMonth.getMonth();
              const firstDay = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const weeks = [];
              let week = [];

              // Fill leading empty cells
              for (let i = 0; i < firstDay; i++) {
                week.push(<View key={`empty-${i}`} style={{ flex: 1, aspectRatio: 1 }} />);
              }

              // Fill days
              for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSelected = dateStr === date;
                const isToday = dateStr === new Date().toISOString().slice(0, 10);

                week.push(
                  <TouchableOpacity
                    key={day}
                    onPress={() => {
                      setDate(dateStr);
                      setShowDatePicker(false);
                    }}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 8,
                      backgroundColor: isSelected ? accent : "transparent",
                      borderWidth: isToday && !isSelected ? 1 : 0,
                      borderColor: accent,
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      color: isSelected ? "#fff" : C.text,
                      fontWeight: isSelected || isToday ? "600" : "400",
                    }}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );

                if (week.length === 7) {
                  weeks.push(<View key={`week-${weeks.length}`} style={{ flexDirection: "row", marginBottom: 4 }}>{week}</View>);
                  week = [];
                }
              }

              // Fill trailing empty cells
              while (week.length > 0 && week.length < 7) {
                week.push(<View key={`empty-end-${week.length}`} style={{ flex: 1, aspectRatio: 1 }} />);
              }
              if (week.length > 0) {
                weeks.push(<View key={`week-${weeks.length}`} style={{ flexDirection: "row", marginBottom: 4 }}>{week}</View>);
              }

              return weeks;
            })()}
          </View>
        )}

        {flash && (
          <Text style={{ textAlign: "center", fontSize: 14, color: flash.ok ? C.green : C.red, marginBottom: 8 }}>
            {flash.msg}
          </Text>
        )}

        <TouchableOpacity
          style={[S.btnPrimary, { backgroundColor: accent }]}
          onPress={handleSubmit} disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={S.btnPrimaryText}>Add {type}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
