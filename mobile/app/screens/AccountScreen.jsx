import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Switch, Alert, BackHandler } from "react-native";
import { useTheme } from "../../src/contexts/ThemeContext.js";
import {
  canUseBiometric,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  authenticateWithBiometric,
  getBiometricTypes,
  getBiometricName,
  isBiometricSupported,
  hasBiometricEnrolled
} from "../../src/services/biometric.js";
import { storeBiometricCredentials, clearBiometricCredentials } from "../../src/services/auth.js";
import { getServerUrl, setServerUrl, DEFAULT_URL } from "../../src/services/serverUrl.js";
import { HistoryScreen } from "./HistoryScreen.jsx";
import { CategoriesScreen } from "./CategoriesScreen.jsx";
import { HouseholdScreen } from "./HouseholdScreen.jsx";
import { CurrencyPicker } from "../../src/components/CurrencyPicker.jsx";

export function AccountScreen({
  user,
  household,
  onLogout,
  onDeleteAccount,
  onChangePassword,
  // Props for sub-screens
  entries,
  onDelete,
  onUpdate,
  pendingSync,
  getCategoryById,
  colorMap,
  incomeCategories,
  expenseCategories,
  allCategories,
  customCats,
  onCreateCategory,
  onDeleteCategory,
  onCreate,
  onAddMember,
  onRemoveMember,
  onLeave,
  onDeleteHousehold,
  onRename,
  openAddMember,
  setOpenAddMember,
  onUpdateProfile,
  currencyList = [],
}) {
  const { isDark, toggleTheme, colors: C, styles: S } = useTheme();
  const [view, setView] = useState("account"); // "account", "history", "categories", "household"
  const [section, setSection]   = useState(null);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]       = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [deletePw, setDeletePw] = useState("");
  const [loading, setLoading]   = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // Server URL state
  const [serverUrl, setServerUrlState] = useState("");
  const [serverUrlDraft, setServerUrlDraft] = useState("");

  useEffect(() => {
    getServerUrl().then(url => { setServerUrlState(url); setServerUrlDraft(url); });
  }, []);

  // Biometric state
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricName, setBiometricName] = useState("Biometric");
  const [biometricPassword, setBiometricPassword] = useState("");

  // Check biometric status on mount
  useEffect(() => {
    (async () => {
      const [supported, enrolled, enabled] = await Promise.all([
        isBiometricSupported(),
        hasBiometricEnrolled(),
        isBiometricEnabled()
      ]);

      setBiometricSupported(supported);
      setBiometricEnrolled(enrolled);
      setBiometricEnabled(enabled);

      // Always set to "Biometrics"
      setBiometricName("Biometrics");
    })();
  }, []);

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view !== "account") {
        setView("account");
        return true; // Prevent default behavior (exit app)
      }
      return false; // Let default behavior happen (go back to previous screen/exit)
    });

    return () => backHandler.remove();
  }, [view]);

  // Handle openAddMember flag from parent
  useEffect(() => {
    if (openAddMember && household) {
      setView("household");
      setOpenAddMember?.(false); // Reset the flag
    }
  }, [openAddMember, household, setOpenAddMember]);

  function flash(ok, msg) { setFeedback({ ok, msg }); if (ok) setTimeout(() => setFeedback(null), 2500); }

  async function handleSaveServerUrl() {
    if (!serverUrlDraft.startsWith("http")) return flash(false, "URL must start with http:// or https://");
    await setServerUrl(serverUrlDraft);
    setServerUrlState(serverUrlDraft);
    setSection(null);
    flash(true, "Server URL saved. Restart the app to apply.");
  }

  async function handleChangePassword() {
    if (newPw.length < 8)    return flash(false, "New password must be at least 8 characters.");
    if (newPw !== confirmPw) return flash(false, "Passwords do not match.");
    setLoading(true);
    try { await onChangePassword({ currentPassword: currentPw, newPassword: newPw }); flash(true, "Password changed."); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setSection(null); }
    catch (e) { flash(false, e.message); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deletePw) return flash(false, "Enter your password to confirm.");
    setLoading(true);
    try { await onDeleteAccount(deletePw); }
    catch (e) { flash(false, e.message); setLoading(false); }
  }

  async function handleBiometricToggle(enable) {
    if (enable) {
      // Enabling biometric - need password to store credentials
      if (section !== "biometric") {
        setSection("biometric");
        return;
      }

      if (!biometricPassword) {
        return flash(false, "Enter your password to enable biometric login.");
      }

      setLoading(true);
      try {
        // First authenticate with biometric to verify device
        const authenticated = await authenticateWithBiometric();
        if (!authenticated) {
          flash(false, "Biometric authentication failed.");
          setLoading(false);
          return;
        }

        // Store credentials and enable biometric
        await storeBiometricCredentials(user.email, biometricPassword);
        await enableBiometric(user.email);
        setBiometricEnabled(true);
        setBiometricPassword("");
        setSection(null);
        flash(true, `${biometricName} login enabled.`);
      } catch (e) {
        flash(false, e.message || "Failed to enable biometric login.");
      } finally {
        setLoading(false);
      }
    } else {
      // Disabling biometric
      Alert.alert(
        `Disable ${biometricName}?`,
        "You'll need to enter your password to sign in.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable",
            style: "destructive",
            onPress: async () => {
              try {
                await disableBiometric();
                await clearBiometricCredentials();
                setBiometricEnabled(false);
                flash(true, `${biometricName} login disabled.`);
              } catch (e) {
                flash(false, e.message || "Failed to disable biometric login.");
              }
            }
          }
        ]
      );
    }
  }

  // Render sub-views
  if (view === "history") {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.bg }}>
          <TouchableOpacity
            onPress={() => setView("account")}
            style={{
              marginRight: 12,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: C.green,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <Text style={{ fontSize: 18, color: "#fff", fontWeight: "bold" }}>◀</Text>
          </TouchableOpacity>
          <Text style={[S.h3]}>History</Text>
        </View>
        <HistoryScreen
          entries={entries}
          onDelete={onDelete}
          onUpdate={onUpdate}
          household={household}
          getCategoryById={getCategoryById}
          colorMap={colorMap}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          allCategories={allCategories}
          pendingSync={pendingSync}
        />
      </View>
    );
  }

  if (view === "categories") {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.bg }}>
          <TouchableOpacity
            onPress={() => setView("account")}
            style={{
              marginRight: 12,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: C.green,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <Text style={{ fontSize: 18, color: "#fff", fontWeight: "bold" }}>◀</Text>
          </TouchableOpacity>
          <Text style={[S.h3]}>Categories</Text>
        </View>
        <CategoriesScreen
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          customCats={customCats}
          onCreateCategory={onCreateCategory}
          onDeleteCategory={onDeleteCategory}
        />
      </View>
    );
  }

  if (view === "household") {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.bg }}>
          <TouchableOpacity
            onPress={() => setView("account")}
            style={{
              marginRight: 12,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: C.green,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <Text style={{ fontSize: 18, color: "#fff", fontWeight: "bold" }}>◀</Text>
          </TouchableOpacity>
          <Text style={[S.h3]}>Household</Text>
        </View>
        <HouseholdScreen
          household={household}
          user={user}
          onCreate={onCreate}
          onAddMember={onAddMember}
          onRemoveMember={onRemoveMember}
          onLeave={onLeave}
          onDelete={onDeleteHousehold}
          onRename={onRename}
          autoOpenAddMember={openAddMember}
        />
      </View>
    );
  }

  return (
    <ScrollView style={S.screen} contentContainerStyle={{ paddingBottom: 48 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
      {/* Title */}
      <Text style={[S.h2, { marginBottom: 20 }]}>Account</Text>

      {/* User info */}
      <View style={[S.row, { marginBottom: 28 }]}>
        <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: C.greenLight, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: C.greenDark }}>{user?.name?.charAt(0)?.toUpperCase() || "?"}</Text>
        </View>
        <View style={{ marginLeft: 14 }}>
          <Text style={[S.h3]}>{user?.name}</Text>
          <Text style={S.small}>{user?.email}</Text>
          {household && (
            <Text style={{ fontSize: 12, color: C.greenDark, marginTop: 3 }}>
              🏠 {household.name} · {household.ownerUserId === user?.userId ? "Owner" : "Member"}
            </Text>
          )}
        </View>
      </View>

      {feedback && (
        <View style={{ padding: 12, borderRadius: 10, borderWidth: 0.5, marginBottom: 14, backgroundColor: feedback.ok ? C.greenLight : C.redLight, borderColor: feedback.ok ? C.greenBorder : C.redBorder }}>
          <Text style={{ fontSize: 13, color: feedback.ok ? C.greenDark : C.redDark }}>{feedback.msg}</Text>
        </View>
      )}

      {/* Dark Mode Toggle */}
      <View style={[S.card, { marginBottom: 12 }]}>
        <View style={[S.rowBetween, { marginBottom: 4 }]}>
          <View style={S.row}>
            <Text style={{ fontSize: 18, marginRight: 12 }}>{isDark ? "🌙" : "☀️"}</Text>
            <Text style={S.body}>Dark Mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: C.bgTertiary, true: C.greenLight }}
            thumbColor={isDark ? C.green : C.textTertiary}
          />
        </View>
        <Text style={[S.small, { marginLeft: 30 }]}>Switch between light and dark theme</Text>
      </View>

      {/* Navigation Cards */}
      <Text style={[S.sectionTitle, { marginTop: 12, marginBottom: 12 }]}>More</Text>

      <TouchableOpacity
        style={[S.card, { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }]}
        onPress={() => setView("history")}
      >
        <Text style={{ fontSize: 18 }}>📋</Text>
        <Text style={[S.body, { fontWeight: "600", flex: 1 }]}>History</Text>
        <Text style={{ fontSize: 18, color: C.textTertiary }}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[S.card, { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }]}
        onPress={() => setView("categories")}
      >
        <Text style={{ fontSize: 18 }}>🏷️</Text>
        <Text style={[S.body, { fontWeight: "600", flex: 1 }]}>Categories</Text>
        <Text style={{ fontSize: 18, color: C.textTertiary }}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[S.card, { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }]}
        onPress={() => setView("household")}
      >
        <Text style={{ fontSize: 18 }}>🏠</Text>
        <Text style={[S.body, { fontWeight: "600", flex: 1 }]}>Household</Text>
        <Text style={{ fontSize: 18, color: C.textTertiary }}>→</Text>
      </TouchableOpacity>

      <Text style={[S.sectionTitle, { marginTop: 12, marginBottom: 12 }]}>Settings</Text>

      {/* Display Currency */}
      <View style={[S.card, { marginBottom: 12 }]}>
        <TouchableOpacity style={S.rowBetween} onPress={() => setShowCurrencyPicker(true)}>
          <View style={S.row}>
            <Text style={{ fontSize: 18, marginRight: 12 }}>💱</Text>
            <Text style={S.body}>Display Currency</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: "600", color: C.green }}>
            {user?.currency} →
          </Text>
        </TouchableOpacity>
        <Text style={[S.small, { marginLeft: 30, marginTop: 4 }]}>
          Stored in original currency, converted on display
        </Text>
        <CurrencyPicker
          visible={showCurrencyPicker}
          selected={user?.currency}
          currencyList={currencyList}
          onSelect={async (code) => {
            setShowCurrencyPicker(false);
            if (code === user?.currency) return;
            try {
              await onUpdateProfile({ currency: code });
              flash(true, `Currency changed to ${code}`);
            } catch (e) {
              flash(false, e.message || "Failed to update currency");
            }
          }}
          onClose={() => setShowCurrencyPicker(false)}
        />
      </View>

      {/* Server URL */}
      <View style={[S.card, { marginBottom: 12 }]}>
        <TouchableOpacity style={S.rowBetween} onPress={() => { setSection(section === "serverUrl" ? null : "serverUrl"); setFeedback(null); }}>
          <View style={S.row}>
            <Text style={{ fontSize: 18, marginRight: 12 }}>🌐</Text>
            <Text style={S.body}>Server URL</Text>
          </View>
          <Text style={{ color: C.textTertiary, fontSize: 18 }}>{section === "serverUrl" ? "−" : "+"}</Text>
        </TouchableOpacity>
        <Text style={[S.small, { marginLeft: 30, marginTop: 4 }]} numberOfLines={1}>{serverUrl}</Text>
        {section === "serverUrl" && (
          <View style={{ marginTop: 14 }}>
            <Text style={[S.label, { marginBottom: 5 }]}>Backend URL</Text>
            <TextInput
              style={S.input}
              value={serverUrlDraft}
              onChangeText={setServerUrlDraft}
              placeholder={DEFAULT_URL}
              placeholderTextColor={C.textTertiary}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TouchableOpacity style={[S.btnPrimary, { backgroundColor: C.green }]} onPress={handleSaveServerUrl}>
              <Text style={S.btnPrimaryText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Biometric Login Toggle */}
      {biometricSupported && biometricEnrolled && (
        <View style={[S.card, { marginBottom: 12 }]}>
          <TouchableOpacity
            style={S.rowBetween}
            onPress={() => {
              if (biometricEnabled) {
                handleBiometricToggle(false);
              } else {
                setSection(section === "biometric" ? null : "biometric");
                setFeedback(null);
              }
            }}
          >
            <View style={S.row}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>🔐</Text>
              <Text style={S.body}>{biometricName} Login</Text>
            </View>
            {!biometricEnabled && (
              <Text style={{ color: C.textTertiary, fontSize: 18 }}>
                {section === "biometric" ? "−" : "+"}
              </Text>
            )}
            {biometricEnabled && (
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: C.bgTertiary, true: C.greenLight }}
                thumbColor={biometricEnabled ? C.green : C.textTertiary}
              />
            )}
          </TouchableOpacity>

          {!biometricEnabled && (
            <Text style={[S.small, { marginLeft: 30, marginTop: 4 }]}>
              Sign in quickly with {biometricName.toLowerCase()}
            </Text>
          )}
          {biometricEnabled && (
            <Text style={[S.small, { marginLeft: 30, marginTop: 4, color: C.greenDark }]}>
              Enabled · Sign in securely with {biometricName.toLowerCase()}
            </Text>
          )}

          {section === "biometric" && !biometricEnabled && (
            <View style={{ marginTop: 14 }}>
              <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>
                Enter your password to enable {biometricName.toLowerCase()} login. Your credentials will be stored securely on this device.
              </Text>
              <Text style={[S.label, { marginBottom: 5 }]}>Password</Text>
              <TextInput
                style={S.input}
                value={biometricPassword}
                onChangeText={setBiometricPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={C.textTertiary}
              />
              <TouchableOpacity
                style={[S.btnPrimary, { backgroundColor: C.green }]}
                onPress={() => handleBiometricToggle(true)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={S.btnPrimaryText}>Enable {biometricName}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Change password */}
      <View style={[S.card, { marginBottom: 12 }]}>
        <TouchableOpacity style={S.rowBetween} onPress={() => { setSection(section === "password" ? null : "password"); setFeedback(null); }}>
          <View style={S.row}><Text style={{ fontSize: 18, marginRight: 12 }}>🔑</Text><Text style={S.body}>Change password</Text></View>
          <Text style={{ color: C.textTertiary, fontSize: 18 }}>{section === "password" ? "−" : "+"}</Text>
        </TouchableOpacity>
        {section === "password" && (
          <View style={{ marginTop: 14 }}>
            {[["Current password", currentPw, setCurrentPw], ["New password", newPw, setNewPw], ["Confirm new password", confirmPw, setConfirmPw]].map(([lbl, val, set]) => (
              <View key={lbl}>
                <Text style={[S.label, { marginBottom: 5 }]}>{lbl}</Text>
                <TextInput style={S.input} value={val} onChangeText={set} secureTextEntry placeholder="••••••••" placeholderTextColor={C.textTertiary} />
              </View>
            ))}
            <TouchableOpacity style={[S.btnPrimary, { backgroundColor: C.green }]} onPress={handleChangePassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.btnPrimaryText}>Update password</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={[S.card, { flexDirection: "row", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 12 }]} onPress={onLogout}>
        <Text style={{ fontSize: 18 }}>🚪</Text>
        <Text style={[S.body, { fontWeight: "600" }]}>Sign out</Text>
      </TouchableOpacity>

      {/* Delete account */}
      <View style={[S.card, { borderColor: C.redBorder }]}>
        <TouchableOpacity style={S.rowBetween} onPress={() => { setSection(section === "delete" ? null : "delete"); setFeedback(null); }}>
          <View style={S.row}><Text style={{ fontSize: 18, marginRight: 12 }}>🗑️</Text><Text style={[S.body, { color: C.red }]}>Delete account</Text></View>
          <Text style={{ color: C.red, fontSize: 18 }}>{section === "delete" ? "−" : "+"}</Text>
        </TouchableOpacity>
        {section === "delete" && (
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 13, color: C.redDark, marginBottom: 12 }}>This permanently deletes your account and all your data.</Text>
            <Text style={[S.label, { marginBottom: 5 }]}>Confirm with your password</Text>
            <TextInput style={S.input} value={deletePw} onChangeText={setDeletePw} secureTextEntry placeholder="••••••••" placeholderTextColor={C.textTertiary} />
            <TouchableOpacity style={[S.btnPrimary, { backgroundColor: C.red }]} onPress={handleDelete} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.btnPrimaryText}>Permanently delete my account</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
      </View>
    </ScrollView>
  );
}
