import "react-native-gesture-handler";
import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator, ScrollView } from "react-native";
import { useAuth }         from "./src/hooks/useAuth.js";
import { useEntries }      from "./src/hooks/useEntries.js";
import { useHousehold }    from "./src/hooks/useHousehold.js";
import { useCategories }   from "./src/hooks/useCategories.js";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext.js";
import { AuthScreen }        from "./app/screens/AuthScreen.jsx";
import { DashboardScreen }   from "./app/screens/DashboardScreen.jsx";
import { AddScreen }         from "./app/screens/AddScreen.jsx";
import { HistoryScreen }     from "./app/screens/HistoryScreen.jsx";
import { HouseholdScreen }   from "./app/screens/HouseholdScreen.jsx";
import { CategoriesScreen }  from "./app/screens/CategoriesScreen.jsx";
import { AccountScreen }     from "./app/screens/AccountScreen.jsx";
import { MONTH_LABELS }   from "./src/utils/theme.js";

const TABS = [
  { id: "dashboard",  label: "Overview",    emoji: "📊" },
  { id: "add",        label: "Add",         emoji: "➕" },
  { id: "history",    label: "History",     emoji: "📋" },
  { id: "categories", label: "Categories",  emoji: "🏷️" },
  { id: "household",  label: "Home",        emoji: "🏠" },
  { id: "account",    label: "Account",     emoji: "👤" },
];

function buildMonths() {
  return Array.from({ length: 36 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });
}

function AppContent() {
  const { isDark, colors: C, styles: S } = useTheme();
  const [appError, setAppError] = useState(null);

  // Global error handler
  useEffect(() => {
    const errorHandler = (error, isFatal) => {
      console.error("Global Error:", error, isFatal);
      setAppError(error?.message || String(error));
    };

    if (global.ErrorUtils) {
      global.ErrorUtils.setGlobalHandler(errorHandler);
    }
  }, []);

  const auth = useAuth();
  const { user, isAuthenticated, ready, loading: authLoading, error: authError, clearError, login, register, logout, deleteAccount, changePassword } = auth;

  // Handle session expiration globally
  useEffect(() => {
    const checkAuth = async () => {
      const { getAccessToken, getRefreshToken } = await import("./src/services/auth.js");
      const [access, refresh] = await Promise.all([getAccessToken(), getRefreshToken()]);
      if (!access && !refresh && isAuthenticated) {
        // Tokens were cleared but user is still set - session expired
        logout();
      }
    };

    if (isAuthenticated) {
      const interval = setInterval(checkAuth, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, logout]);

  const [tab, setTab]               = useState("dashboard");
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const { household, createHousehold, addMember, removeMember, leaveHousehold, deleteHousehold, renameHousehold } = useHousehold(isAuthenticated);
  const householdId = household?.householdId || null;

  const { entries, allEntries, loading: entriesLoading, error: entriesError, addEntry, updateEntry, removeEntry } = useEntries(filterMonth, isAuthenticated, householdId);

  const { incomeCategories, expenseCategories, allCategories, customCats, colorMap, getCategoryById, createCategory, deleteCategory } = useCategories(isAuthenticated);

  // Show error screen if something crashed
  if (appError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg, padding: 20 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
        <Text style={{ fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 8 }}>Something went wrong</Text>
        <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: "center", marginBottom: 20 }}>{appError}</Text>
        <TouchableOpacity onPress={() => setAppError(null)} style={{ backgroundColor: C.green, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Splash screen while AsyncStorage rehydrates
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>💰</Text>
        <ActivityIndicator color={C.green} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onLogin={login} onRegister={register} loading={authLoading} error={authError} onClearError={clearError} />;
  }

  const d = new Date(filterMonth + "-01");
  const monthLabel = `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
  const months = buildMonths();

  // Category data passed down to all screens
  const catProps = { incomeCategories, expenseCategories, allCategories, colorMap, getCategoryById };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: StatusBar.currentHeight || 0 }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.bg} translucent={false} />

      {/* Header */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: C.border,
      }}>
        <View>
          {household && (
            <View style={{
              backgroundColor: C.greenLight,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              borderWidth: 0.5,
              borderColor: C.greenBorder,
            }}>
              <Text style={{ fontSize: 11, color: C.greenDark }}>🏠 {household.name}</Text>
            </View>
          )}
        </View>
        {entriesLoading && <ActivityIndicator color={C.green} size="small" />}
      </View>

      {/* Month picker - moved to dashboard */}
      {showMonthPicker && tab === "dashboard" && (
        <View style={{
          backgroundColor: C.cardBg,
          borderBottomWidth: 0.5,
          borderBottomColor: C.border,
          maxHeight: 300,
        }}>
          <ScrollView>
            {months.map(m => {
              const md = new Date(m + "-01");
              return (
                <TouchableOpacity key={m} style={[{
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderBottomWidth: 0.5,
                  borderBottomColor: C.border,
                }, m === filterMonth && { backgroundColor: C.greenLight }]}
                  onPress={() => { setFilterMonth(m); setShowMonthPicker(false); }}>
                  <Text style={{ fontSize: 14, color: m === filterMonth ? C.greenDark : C.text, fontWeight: m === filterMonth ? "600" : "400" }}>
                    {MONTH_LABELS[md.getMonth()]} {md.getFullYear()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Error banner */}
      {entriesError && (
        <View style={{
          backgroundColor: C.redLight,
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderBottomWidth: 0.5,
          borderBottomColor: C.redBorder,
        }}>
          <Text style={{ fontSize: 13, color: C.redDark }}>⚠ {entriesError} — showing cached data</Text>
        </View>
      )}

      {/* Screens */}
      <View style={{ flex: 1 }}>
        {tab === "dashboard" && (
          <DashboardScreen
            entries={entries}
            allEntries={allEntries}
            filterMonth={filterMonth}
            setFilterMonth={setFilterMonth}
            household={household}
            {...catProps}
          />
        )}
        {tab === "add" && (
          <AddScreen onAdd={addEntry} authorName={user?.name} currency={user?.currency} incomeCategories={incomeCategories} expenseCategories={expenseCategories} colorMap={colorMap} />
        )}
        {tab === "history" && (
          <HistoryScreen entries={entries} onDelete={removeEntry} onUpdate={updateEntry} household={household} {...catProps} />
        )}
        {tab === "categories" && (
          <CategoriesScreen incomeCategories={incomeCategories} expenseCategories={expenseCategories} customCats={customCats} onCreateCategory={createCategory} onDeleteCategory={deleteCategory} />
        )}
        {tab === "household" && (
          <HouseholdScreen household={household} user={user} onCreate={createHousehold} onAddMember={addMember} onRemoveMember={removeMember} onLeave={leaveHousehold} onDelete={deleteHousehold} onRename={renameHousehold} />
        )}
        {tab === "account" && (
          <AccountScreen user={user} household={household} onLogout={logout} onDeleteAccount={deleteAccount} onChangePassword={changePassword} />
        )}
      </View>

      {/* Bottom tab bar */}
      <View style={{
        flexDirection: "row",
        backgroundColor: C.cardBg,
        borderTopWidth: 0.5,
        borderTopColor: C.border,
        paddingBottom: 8,
        paddingTop: 8,
      }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <TouchableOpacity
              key={t.id} style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 8,
                position: "relative",
              }}
              onPress={() => { setTab(t.id); setShowMonthPicker(false); }}
              activeOpacity={0.7}
            >
              <View style={{ position: "relative" }}>
                <Text style={{ fontSize: 18 }}>{t.emoji}</Text>
                {t.id === "household" && household && (
                  <View style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: C.green,
                  }} />
                )}
              </View>
              <Text style={{
                fontSize: 10,
                marginTop: 3,
                color: active ? C.text : C.textTertiary,
                fontWeight: active ? "700" : "400"
              }}>
                {t.label}
              </Text>
              {active && <View style={{
                position: "absolute",
                bottom: 0,
                width: 32,
                height: 2.5,
                backgroundColor: C.green,
                borderRadius: 2,
              }} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
