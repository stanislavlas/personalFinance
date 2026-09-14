import "react-native-gesture-handler";
import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator, ScrollView, Dimensions, Modal } from "react-native";
import { useAuth }         from "./src/hooks/useAuth.js";
import { useEntries }      from "./src/hooks/useEntries.js";
import { useHousehold }    from "./src/hooks/useHousehold.js";
import { useCategories }   from "./src/hooks/useCategories.js";
import { useCurrencies }   from "./src/hooks/useCurrencies.js";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext.js";
import { NetworkProvider } from "./src/contexts/NetworkContext.js";
import { SyncIndicator }   from "./src/components/SyncIndicator.jsx";
import { OfflineBanner }   from "./src/components/OfflineBanner.jsx";
import { AuthScreen }        from "./app/screens/AuthScreen.jsx";
import { MonthOverviewScreen } from "./app/screens/MonthOverviewScreen.jsx";
import { YearOverviewScreen }  from "./app/screens/YearOverviewScreen.jsx";
import { AddScreen }         from "./app/screens/AddScreen.jsx";
import { AccountScreen }     from "./app/screens/AccountScreen.jsx";
import { MONTH_LABELS }   from "./src/utils/theme.js";
import { authenticateWithBiometric } from "./src/services/biometric.js"; // used in biometric enroll modal

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = [
  { id: "month",    label: "Month",    emoji: "📊" },
  { id: "year",     label: "Year",     emoji: "📅" },
  { id: "add",      label: "Add",      emoji: "➕" },
  { id: "account",  label: "Account",  emoji: "👤" },
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
  const scrollViewRef = useRef(null);
  const [tabScrollEnabled, setTabScrollEnabled] = useState(true);

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

  // Debug: Log API URL on mount
  useEffect(() => {
    console.log('🔍 API_BASE_URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
  }, []);

  const auth = useAuth();
  const { user, isAuthenticated, ready, loading: authLoading, error: authError, clearError, login, register, logout, deleteAccount, changePassword, updateProfile, loginWithBiometric, pendingBiometricEnroll, confirmBiometricEnroll, dismissBiometricEnroll } = auth;

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

  const [tab, setTab]               = useState("month");
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showPersonalOnly, setShowPersonalOnly] = useState(false); // Toggle for personal vs household view
  const [openHouseholdAddMember, setOpenHouseholdAddMember] = useState(false); // Flag to open add member form

  // Check if user is household owner
  const isHouseholdOwner = household?.ownerUserId === user?.userId;

  // Reset to default tab on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setTab("month");
    }
  }, [isAuthenticated]);

  // Scroll to tab when tab changes
  useEffect(() => {
    const tabIndex = TABS.findIndex(t => t.id === tab);
    if (tabIndex >= 0 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: tabIndex * SCREEN_WIDTH, animated: true });
    }
  }, [tab]);

  const { household, createHousehold, addMember, removeMember, leaveHousehold, deleteHousehold, renameHousehold } = useHousehold(isAuthenticated);
  const householdId = household?.householdId || null;

  const { currencyList } = useCurrencies();

  // Use personal entries if toggle is on, or if no household
  const effectiveHouseholdId = (showPersonalOnly || !householdId) ? null : householdId;

  // Wrapper to pass user currency to createHousehold
  const handleCreateHousehold = useCallback(async (name) => {
    return createHousehold(name, user?.currency || "USD");
  }, [createHousehold, user]);

  const { entries, allEntries, loading: entriesLoading, error: entriesError, addEntry, updateEntry, removeEntry, pendingSync } = useEntries(filterMonth, isAuthenticated, effectiveHouseholdId);

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
    return <AuthScreen onLogin={login} onRegister={register} loading={authLoading} error={authError} onClearError={clearError} onBiometricLogin={loginWithBiometric} currencyList={currencyList} />;
  }

  const d = new Date(filterMonth + "-01");
  const monthLabel = `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
  const months = buildMonths();

  // Category data passed down to all screens
  const catProps = { incomeCategories, expenseCategories, allCategories, colorMap, getCategoryById };

  // Handle scroll to update active tab
  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
    const newTab = TABS[currentIndex]?.id;
    if (newTab && newTab !== tab) {
      setTab(newTab);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: StatusBar.currentHeight || 0 }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.bg} translucent={false} />

      {/* Biometric enrollment prompt — shown after login/register when device supports biometrics */}
      <Modal visible={!!pendingBiometricEnroll} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{ backgroundColor: C.cardBg, borderRadius: 16, padding: 24, width: "100%" }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 8 }}>Enable Biometrics?</Text>
            <Text style={{ fontSize: 14, color: C.textSecondary, marginBottom: 20 }}>
              Sign in quickly next time using biometrics instead of your password.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: C.green, borderRadius: 10, paddingVertical: 13, alignItems: "center", marginBottom: 10 }}
              onPress={async () => {
                try {
                  const ok = await authenticateWithBiometric();
                  if (ok) {
                    await confirmBiometricEnroll();
                  } else {
                    dismissBiometricEnroll();
                  }
                } catch {
                  dismissBiometricEnroll();
                }
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Enable</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ borderRadius: 10, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: C.border }}
              onPress={dismissBiometricEnroll}
            >
              <Text style={{ color: C.textSecondary, fontWeight: "600", fontSize: 15 }}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
        {/* Left side - Add Member button for household owners */}
        <View>
          {household && isHouseholdOwner && !showPersonalOnly && (
            <TouchableOpacity
              onPress={() => {
                setTab("account");
                setOpenHouseholdAddMember(true);
                // Scroll to account after state update
                setTimeout(() => {
                  const accountIndex = TABS.findIndex(t => t.id === "account");
                  if (accountIndex >= 0 && scrollViewRef.current) {
                    scrollViewRef.current.scrollTo({ x: accountIndex * SCREEN_WIDTH, animated: true });
                  }
                }, 100);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: C.greenLight,
                borderWidth: 0.5,
                borderColor: C.greenBorder,
              }}
            >
              <Text style={{ fontSize: 16 }}>👥</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: C.greenDark }}>Add Member</Text>
            </TouchableOpacity>
          )}
        </View>

         {/* Right side - View toggle, sync indicator and loading indicator */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {household && (
            <TouchableOpacity
              onPress={() => setShowPersonalOnly(!showPersonalOnly)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 0.5,
                borderColor: showPersonalOnly ? C.border : C.greenBorder,
                backgroundColor: showPersonalOnly ? C.bgSecondary : C.greenLight,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: showPersonalOnly ? C.text : C.greenDark }}>
                {showPersonalOnly ? "👤 Personal" : `🏠 ${household.name}`}
              </Text>
            </TouchableOpacity>
          )}
          <SyncIndicator />
          {entriesLoading && <ActivityIndicator color={C.green} size="small" />}
        </View>
      </View>

      {/* Month picker - moved to dashboard */}
      {showMonthPicker && tab === "month" && (
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

      {/* Offline banner — shown when offline with pending changes */}
      <OfflineBanner />

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
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
        bounces={false}
        scrollEnabled={tabScrollEnabled}
      >
        {TABS.map(t => (
          <View key={t.id} style={{ width: SCREEN_WIDTH }}>
            {t.id === "month" && (
              <MonthOverviewScreen
                entries={entries}
                allEntries={allEntries}
                filterMonth={filterMonth}
                setFilterMonth={setFilterMonth}
                household={household}
                showPersonalOnly={showPersonalOnly}
                pendingSync={pendingSync}
                setTabScrollEnabled={setTabScrollEnabled}
                {...catProps}
              />
            )}
            {t.id === "year" && (
              <YearOverviewScreen
                allEntries={allEntries}
                filterMonth={filterMonth}
              />
            )}
            {t.id === "add" && (
              <AddScreen onAdd={addEntry} authorName={user?.name} currency={user?.currency} incomeCategories={incomeCategories} expenseCategories={expenseCategories} colorMap={colorMap} />
            )}
            {t.id === "account" && (
              <AccountScreen
                user={user}
                household={household}
                onLogout={logout}
                onDeleteAccount={deleteAccount}
                onChangePassword={changePassword}
                entries={entries}
                onDelete={removeEntry}
                onUpdate={updateEntry}
                pendingSync={pendingSync}
                {...catProps}
                customCats={customCats}
                onCreateCategory={createCategory}
                onDeleteCategory={deleteCategory}
                onCreate={handleCreateHousehold}
                onAddMember={addMember}
                onRemoveMember={removeMember}
                onLeave={leaveHousehold}
                onDeleteHousehold={deleteHousehold}
                onRename={renameHousehold}
                openAddMember={openHouseholdAddMember}
                setOpenAddMember={setOpenHouseholdAddMember}
                onUpdateProfile={updateProfile}
                currencyList={currencyList}
              />
            )}
          </View>
        ))}
      </ScrollView>

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
      <NetworkProvider>
        <AppContent />
      </NetworkProvider>
    </ThemeProvider>
  );
}
