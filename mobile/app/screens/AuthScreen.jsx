import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useTheme } from "../../src/contexts/ThemeContext.js";
import { canUseBiometric } from "../../src/services/biometric.js";
import { logger } from "../../src/utils/logger.js";
import { getServerUrl, setServerUrl, DEFAULT_URL } from "../../src/services/serverUrl.js";
import { CurrencyPicker } from "../../src/components/CurrencyPicker.jsx";

export function AuthScreen({ onLogin, onRegister, loading, error, onClearError, onBiometricLogin, currencyList = [] }) {
  const { colors: C, styles: S } = useTheme();
  const [mode, setMode]           = useState("login");
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [localError, setLocalError] = useState(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showServerUrl, setShowServerUrl] = useState(false);
  const [serverUrlDraft, setServerUrlDraft] = useState("");
  const [serverUrl, setServerUrlState] = useState("");
  const [currency, setCurrency]                     = useState("EUR");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const displayError = localError || error;

  useEffect(() => {
    canUseBiometric().then(setBiometricAvailable);
    getServerUrl().then(url => { setServerUrlState(url); setServerUrlDraft(url); });
  }, []);

  function switchMode(m) { setMode(m); setLocalError(null); onClearError?.(); }

  async function handleSaveServerUrl() {
    if (!serverUrlDraft.startsWith("http")) {
      setLocalError("URL must start with http:// or https://");
      return;
    }
    await setServerUrl(serverUrlDraft);
    setServerUrlState(serverUrlDraft);
    setShowServerUrl(false);
  }

  async function handleSubmit() {
    setLocalError(null); onClearError?.();

    if (mode === "register") {
      if (!name.trim())         return setLocalError("Name is required.");
      if (!email.includes("@")) return setLocalError("Enter a valid email.");
      if (password.length < 8)  return setLocalError("Password must be at least 8 characters.");
      if (password !== confirm)  return setLocalError("Passwords do not match.");
      try {
        await onRegister({ name: name.trim(), email: email.trim().toLowerCase(), password, currency });
      } catch (err) {
        logger.error('ui', 'onRegister failed', err.message);
      }
    } else {
      if (!email || !password) return setLocalError("Email and password are required.");
      try {
        await onLogin({ email: email.trim().toLowerCase(), password });
      } catch (err) {
        logger.error('ui', 'onLogin failed', err.message);
      }
    }
  }

  return (
    <KeyboardAvoidingView style={S.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <Text style={{ fontSize: 48, textAlign: "center", marginBottom: 8 }}>💰</Text>
        <Text style={[S.h1, { textAlign: "center", marginBottom: 4 }]}>Budget</Text>
        <Text style={[S.small, { textAlign: "center", marginBottom: 40 }]}>Personal finance tracker</Text>

        {/* Tab toggle */}
        <View style={{ flexDirection: "row", backgroundColor: C.bgSecondary, borderRadius: 10, padding: 4, marginBottom: 20 }}>
          {["login","register"].map(m => (
            <TouchableOpacity
              key={m}
              style={{
                flex: 1,
                paddingVertical: 9,
                alignItems: "center",
                borderRadius: 8,
                backgroundColor: mode === m ? C.bg : "transparent",
                shadowColor: mode === m ? "#000" : "transparent",
                shadowOpacity: mode === m ? 0.08 : 0,
                shadowRadius: mode === m ? 3 : 0,
                shadowOffset: mode === m ? { width: 0, height: 1 } : { width: 0, height: 0 },
              }}
              onPress={() => switchMode(m)}
            >
              <Text style={{ fontSize: 14, fontWeight: mode === m ? "600" : "400", color: mode === m ? C.text : C.textTertiary }}>
                {m === "login" ? "Sign in" : "Register"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Error */}
        {displayError && (
          <View style={{ backgroundColor: C.redLight, borderRadius: 10, borderWidth: 0.5, borderColor: C.redBorder, padding: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, color: C.redDark }}>{displayError}</Text>
          </View>
        )}

        {/* Fields */}
        {mode === "register" && (
          <>
            <Text style={[S.label, { marginBottom: 6 }]}>Full name</Text>
            <TextInput style={S.input} placeholder="Your name" value={name} onChangeText={setName} autoCapitalize="words" placeholderTextColor={C.textTertiary} />
          </>
        )}

        <Text style={[S.label, { marginBottom: 6 }]}>Email</Text>
        <TextInput style={S.input} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholderTextColor={C.textTertiary} />

        <Text style={[S.label, { marginBottom: 6 }]}>Password</Text>
        <TextInput style={S.input} placeholder={mode === "register" ? "Min. 8 characters" : "••••••••"} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={C.textTertiary} />

        {mode === "register" && (
          <>
            <Text style={[S.label, { marginBottom: 6 }]}>Confirm password</Text>
            <TextInput style={S.input} placeholder="Repeat password" value={confirm} onChangeText={setConfirm} secureTextEntry placeholderTextColor={C.textTertiary} />
            <Text style={[S.label, { marginBottom: 6 }]}>Currency</Text>
            <TouchableOpacity
              style={[S.input, { justifyContent: "center" }]}
              onPress={() => setShowCurrencyPicker(true)}
            >
              <Text style={{ color: C.text }}>
                {currency}{currencyList.find(c => c.code === currency) ? ` — ${currencyList.find(c => c.code === currency).name}` : ""}
              </Text>
            </TouchableOpacity>
            <CurrencyPicker
              visible={showCurrencyPicker}
              selected={currency}
              currencyList={currencyList}
              onSelect={setCurrency}
              onClose={() => setShowCurrencyPicker(false)}
            />
          </>
        )}

        <TouchableOpacity style={[S.btnPrimary, { backgroundColor: C.green }]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.btnPrimaryText}>{mode === "login" ? "Sign in" : "Create account"}</Text>}
        </TouchableOpacity>

        {/* Biometric button — fallback if user dismissed the auto-prompt */}
        {mode === "login" && biometricAvailable && (
          <TouchableOpacity
            style={{ marginTop: 12, paddingVertical: 12, alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgSecondary }}
            onPress={onBiometricLogin}
            disabled={loading}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>🔐</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>Sign in with Biometrics</Text>
            </View>
          </TouchableOpacity>
        )}

        <Text style={[S.small, { textAlign: "center", marginTop: 24, color: C.textTertiary }]}>
          Your data is stored privately in AWS DynamoDB.
        </Text>

        {/* Server URL — collapsed by default */}
        <TouchableOpacity onPress={() => setShowServerUrl(v => !v)} style={{ marginTop: 24, alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: C.textTertiary }}>⚙ Server: {serverUrl}</Text>
        </TouchableOpacity>
        {showServerUrl && (
          <View style={{ marginTop: 10 }}>
            <Text style={[S.label, { marginBottom: 6 }]}>Backend URL</Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

